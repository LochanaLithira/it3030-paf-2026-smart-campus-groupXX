package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.ResourceHeatmapAvailabilityWindow;
import com.smartcampus.backend.dto.resource.ResourceHeatmapLocation;
import com.smartcampus.backend.dto.resource.ResourceHeatmapPeakSlot;
import com.smartcampus.backend.dto.resource.ResourceHeatmapPeriod;
import com.smartcampus.backend.dto.resource.ResourceHeatmapResolvedPeriod;
import com.smartcampus.backend.dto.resource.ResourceHeatmapResponse;
import com.smartcampus.backend.dto.resource.ResourceHeatmapRow;
import com.smartcampus.backend.dto.resource.ResourceHeatmapSummary;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceAvailabilityRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceHeatmapService {

    private static final int START_HOUR = 8;
    private static final int END_HOUR = 20;

    private final ResourceRepository resourceRepository;
    private final ResourceAvailabilityRepository resourceAvailabilityRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public ResourceHeatmapResponse getResourceHeatmap(
            UUID resourceId,
            String periodParam,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId));

        DateRange range = resolveDateRange(periodParam, startDate, endDate);

        Map<CellKey, CellAggregate> aggregateByCell = loadBookingAggregates(resourceId, range.startDate(), range.endDate());

        List<ResourceAvailability> availability = resourceAvailabilityRepository.findByResource_ResourceId(resourceId);
        AvailabilityProjection availabilityProjection = projectAvailability(availability, range.startDate(), range.endDate());

        List<ResourceHeatmapRow> rows = new ArrayList<>();
        ResourceHeatmapPeakSlot peakSlot = null;
        int peakValue = -1;
        int idleSlots = 0;
        int avgAccumulator = 0;
        int avgCount = 0;

        for (int hour = START_HOUR; hour <= END_HOUR; hour++) {
            Map<DayOfWeek, Integer> days = new LinkedHashMap<>();
            Map<DayOfWeek, Integer> bookingCounts = new LinkedHashMap<>();

            for (DayOfWeek day : DayOfWeek.values()) {
                boolean available = availabilityProjection.fullGridAvailable() || isSlotAvailable(availabilityProjection.windowsByDay(), day, hour);
                if (!available) {
                    days.put(day, null);
                    bookingCounts.put(day, null);
                    continue;
                }

                CellAggregate aggregate = aggregateByCell.get(new CellKey(day, hour));
                int utilization = aggregate == null ? 0 : aggregate.utilizationPct();
                int bookingCount = aggregate == null ? 0 : aggregate.bookingCount();

                days.put(day, utilization);
                bookingCounts.put(day, bookingCount);

                if (utilization == 0) {
                    idleSlots++;
                }
                if (utilization > 0) {
                    avgAccumulator += utilization;
                    avgCount++;
                }
                if (utilization > peakValue) {
                    peakValue = utilization;
                    peakSlot = new ResourceHeatmapPeakSlot(day, formatHourSlot(hour), utilization);
                }
            }

            rows.add(new ResourceHeatmapRow(formatHourSlot(hour), days, bookingCounts));
        }

        int avgUtilization = avgCount == 0 ? 0 : Math.round((float) avgAccumulator / avgCount);
        ResourceHeatmapSummary summary = new ResourceHeatmapSummary(
                peakValue > 0 ? peakSlot : null,
                avgUtilization,
                idleSlots
        );

        return new ResourceHeatmapResponse(
                resource.getResourceId(),
                resource.getName(),
                resource.getType(),
                resource.getStatus(),
                // Current schema no longer links Resource -> Location directly.
                new ResourceHeatmapLocation(null, null, null),
                new ResourceHeatmapResolvedPeriod(range.periodKey(), range.startDate(), range.endDate()),
                summary,
                availabilityProjection.windows(),
                rows
        );
    }

    private DateRange resolveDateRange(String periodParam, LocalDate startDate, LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new AppException("Both start_date and end_date are required for custom ranges", HttpStatus.BAD_REQUEST);
        }

        if (startDate != null) {
            if (endDate.isBefore(startDate)) {
                throw new AppException("end_date must be on or after start_date", HttpStatus.BAD_REQUEST);
            }
            return new DateRange("custom", startDate, endDate);
        }

        ResourceHeatmapPeriod period;
        try {
            period = ResourceHeatmapPeriod.fromQueryParam(periodParam);
        } catch (IllegalArgumentException ex) {
            throw new AppException(ex.getMessage(), HttpStatus.BAD_REQUEST);
        }

        LocalDate today = LocalDate.now();
        return switch (period) {
            case THIS_WEEK -> {
                LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                yield new DateRange("this_week", weekStart, weekStart.plusDays(6));
            }
            case LAST_WEEK -> {
                LocalDate thisWeekStart = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                LocalDate lastWeekStart = thisWeekStart.minusWeeks(1);
                yield new DateRange("last_week", lastWeekStart, lastWeekStart.plusDays(6));
            }
            case THIS_MONTH -> {
                LocalDate first = today.withDayOfMonth(1);
                LocalDate last = today.with(TemporalAdjusters.lastDayOfMonth());
                yield new DateRange("this_month", first, last);
            }
            case CUSTOM -> throw new AppException("Custom period requires start_date and end_date", HttpStatus.BAD_REQUEST);
        };
    }

    private Map<CellKey, CellAggregate> loadBookingAggregates(UUID resourceId, LocalDate startDate, LocalDate endDate) {
        List<BookingRepository.ResourceHeatmapAggregate> aggregates =
                bookingRepository.aggregateResourceHeatmap(resourceId, startDate, endDate);

        Map<CellKey, CellAggregate> byCell = new HashMap<>();
        for (BookingRepository.ResourceHeatmapAggregate row : aggregates) {
            DayOfWeek day = parseDayAbbreviation(row.getDayAbbr());
            if (day == null || row.getHourOfDay() == null) {
                continue;
            }

            byCell.put(
                    new CellKey(day, row.getHourOfDay()),
                    new CellAggregate(
                            safeInt(row.getBookingCount()),
                            safeInt(row.getDistinctBookingDates()),
                            safeInt(row.getUtilizationPct())
                    )
            );
        }
        return byCell;
    }

    private AvailabilityProjection projectAvailability(List<ResourceAvailability> availability, LocalDate startDate, LocalDate endDate) {
        if (availability.isEmpty()) {
            return new AvailabilityProjection(true, Map.of(), List.of());
        }

        Map<DayOfWeek, List<Window>> windowsByDay = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek day : DayOfWeek.values()) {
            windowsByDay.put(day, new ArrayList<>());
        }

        Set<String> emittedWindows = new HashSet<>();
        List<ResourceHeatmapAvailabilityWindow> responseWindows = new ArrayList<>();

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            DayOfWeek day = toDayOfWeek(cursor.getDayOfWeek());
            for (ResourceAvailability slot : availability) {
                if (!matchesDate(slot, cursor)) {
                    continue;
                }

                Window window = new Window(slot.getStartTime(), slot.getEndTime());
                windowsByDay.get(day).add(window);

                String key = day + "|" + window.startTime() + "|" + window.endTime();
                if (emittedWindows.add(key)) {
                    responseWindows.add(new ResourceHeatmapAvailabilityWindow(
                            day,
                            window.startTime().toString(),
                            window.endTime().toString()
                    ));
                }
            }

            cursor = cursor.plusDays(1);
        }

        return new AvailabilityProjection(false, windowsByDay, responseWindows);
    }

    private boolean matchesDate(ResourceAvailability slot, LocalDate date) {
        AvailabilityRecurrenceType recurrence = slot.getRecurrenceType();
        if (recurrence == null) {
            return slot.getDayOfWeek() == toDayOfWeek(date.getDayOfWeek());
        }

        return switch (recurrence) {
            case DAILY -> true;
            case WEEKLY -> slot.getDayOfWeek() == toDayOfWeek(date.getDayOfWeek());
            case MONTHLY -> slot.getDayOfMonth() != null && slot.getDayOfMonth() == date.getDayOfMonth();
        };
    }

    private boolean isSlotAvailable(Map<DayOfWeek, List<Window>> windowsByDay, DayOfWeek day, int hour) {
        List<Window> windows = windowsByDay.get(day);
        if (windows == null || windows.isEmpty()) {
            return false;
        }

        LocalTime slotStart = LocalTime.of(hour, 0);
        LocalTime slotEnd = slotStart.plusHours(1);

        for (Window window : windows) {
            // Keep cells hour-based (e.g. 10:00-11:00). A slot is available when the full hour fits.
            if (!slotStart.isBefore(window.startTime()) && !slotEnd.isAfter(window.endTime())) {
                return true;
            }
        }

        return false;
    }

    private DayOfWeek parseDayAbbreviation(String input) {
        if (input == null) {
            return null;
        }

        String normalized = input.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "MON" -> DayOfWeek.MON;
            case "TUE" -> DayOfWeek.TUE;
            case "WED" -> DayOfWeek.WED;
            case "THU" -> DayOfWeek.THU;
            case "FRI" -> DayOfWeek.FRI;
            case "SAT" -> DayOfWeek.SAT;
            case "SUN" -> DayOfWeek.SUN;
            default -> null;
        };
    }

    private DayOfWeek toDayOfWeek(java.time.DayOfWeek day) {
        return switch (day) {
            case MONDAY -> DayOfWeek.MON;
            case TUESDAY -> DayOfWeek.TUE;
            case WEDNESDAY -> DayOfWeek.WED;
            case THURSDAY -> DayOfWeek.THU;
            case FRIDAY -> DayOfWeek.FRI;
            case SATURDAY -> DayOfWeek.SAT;
            case SUNDAY -> DayOfWeek.SUN;
        };
    }

    private String formatHourSlot(int hour) {
        return String.format("%02d:00", hour);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private record DateRange(String periodKey, LocalDate startDate, LocalDate endDate) {
    }

    private record CellKey(DayOfWeek day, int hour) {
    }

    private record CellAggregate(int bookingCount, int distinctBookingDates, int utilizationPct) {
    }

    private record Window(LocalTime startTime, LocalTime endTime) {
    }

    private record AvailabilityProjection(
            boolean fullGridAvailable,
            Map<DayOfWeek, List<Window>> windowsByDay,
            List<ResourceHeatmapAvailabilityWindow> windows
    ) {
    }
}

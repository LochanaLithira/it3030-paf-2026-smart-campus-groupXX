package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.booking.BookingSuggestion;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceAvailabilityRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingSuggestionService {

    private static final Duration STEP = Duration.ofMinutes(30);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceAvailabilityRepository availabilityRepository;

    public List<BookingSuggestion> suggest(
            Resource requestedResource,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    ) {
        Duration duration = Duration.between(startTime, endTime);
        if (duration.isNegative() || duration.isZero()) return List.of();

        List<BookingSuggestion> suggestions = new ArrayList<>();

        // 1) Same resource alternative slots
        suggestions.addAll(suggestForResource(
                BookingSuggestion.SuggestionKind.SAME_RESOURCE,
                requestedResource,
                date,
                duration,
                4
        ));

        // 2) Other similar resources (same type, ACTIVE)
        List<Resource> alternatives = resourceRepository
                .findTop8ByTypeAndStatusAndResourceIdNotOrderByNameAsc(
                        requestedResource.getType(),
                        ResourceStatus.ACTIVE,
                        requestedResource.getResourceId()
                );

        for (Resource r : alternatives) {
            if (suggestions.size() >= 8) break;
            suggestions.addAll(suggestForResource(
                    BookingSuggestion.SuggestionKind.OTHER_RESOURCE,
                    r,
                    date,
                    duration,
                    2
            ));
        }

        return suggestions.stream()
                .sorted(Comparator.comparing(BookingSuggestion::kind).thenComparing(BookingSuggestion::startTime))
                .limit(8)
                .toList();
    }

    private List<BookingSuggestion> suggestForResource(
            BookingSuggestion.SuggestionKind kind,
            Resource resource,
            LocalDate date,
            Duration duration,
            int limit
    ) {
        List<ResourceAvailability> windows = availabilityRepository.findByResource_ResourceId(resource.getResourceId())
            .stream()
            .filter(w -> matchesDate(w.getRecurrenceType(), w.getDayOfWeek(), w.getDayOfMonth(), date))
            .toList();
        if (windows.isEmpty()) return List.of();

        List<Booking> active = bookingRepository.findActiveByResourceAndDate(resource.getResourceId(), date);

        List<TimeRange> blocked = active.stream()
                .map(b -> new TimeRange(b.getStartTime(), b.getEndTime()))
                .sorted(Comparator.comparing(TimeRange::start))
                .toList();

        List<BookingSuggestion> out = new ArrayList<>();

        for (ResourceAvailability w : windows) {
            LocalTime candidate = w.getStartTime();
            while (!candidate.plus(duration).isAfter(w.getEndTime())) {
                LocalTime candEnd = candidate.plus(duration);
                if (!overlapsAny(candidate, candEnd, blocked)) {
                    out.add(new BookingSuggestion(kind, resource.getResourceId(), resource.getName(), candidate, candEnd));
                    if (out.size() >= limit) return out;
                }
                candidate = candidate.plusMinutes(STEP.toMinutes());
            }
        }

        return out;
    }

    private boolean overlapsAny(LocalTime start, LocalTime end, List<TimeRange> blocked) {
        for (TimeRange b : blocked) {
            if (start.isBefore(b.end) && end.isAfter(b.start)) return true;
        }
        return false;
    }

    private DayOfWeek toDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> DayOfWeek.MON;
            case TUESDAY -> DayOfWeek.TUE;
            case WEDNESDAY -> DayOfWeek.WED;
            case THURSDAY -> DayOfWeek.THU;
            case FRIDAY -> DayOfWeek.FRI;
            case SATURDAY -> DayOfWeek.SAT;
            case SUNDAY -> DayOfWeek.SUN;
        };
    }

    private boolean matchesDate(
            AvailabilityRecurrenceType recurrenceType,
            DayOfWeek dayOfWeek,
            Integer dayOfMonth,
            LocalDate date
    ) {
        if (recurrenceType == null) {
            return dayOfWeek == toDayOfWeek(date);
        }

        return switch (recurrenceType) {
            case DAILY -> true;
            case WEEKLY -> dayOfWeek == toDayOfWeek(date);
            case MONTHLY -> dayOfMonth != null && dayOfMonth == date.getDayOfMonth();
        };
    }

    private record TimeRange(LocalTime start, LocalTime end) {}
}


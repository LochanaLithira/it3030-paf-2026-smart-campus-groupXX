package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.model.Location;
import com.smartcampus.backend.model.LocationAvailability;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.LocationAvailabilityRepository;
import com.smartcampus.backend.repository.ResourceAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingValidationService {

    private final BookingRepository bookingRepository;
    private final ResourceAvailabilityRepository availabilityRepository;
    private final LocationAvailabilityRepository locationAvailabilityRepository;
    private final Clock clock = Clock.systemDefaultZone();

    public void validateCreate(
            Resource resource,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer expectedAttendees
    ) {
        if (endTime == null || startTime == null || !endTime.isAfter(startTime)) {
            throw new AppException("End time must be after start time", HttpStatus.BAD_REQUEST);
        }

        if (bookingDate == null) {
            throw new AppException("Booking date is required", HttpStatus.BAD_REQUEST);
        }

        // Past time slots guard (date == today and endTime <= now, or date < today)
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(clock.withZone(zone));
        if (bookingDate.isBefore(today)) {
            throw new AppException("Bookings cannot be made for past dates", HttpStatus.BAD_REQUEST);
        }
        if (bookingDate.isEqual(today)) {
            LocalTime now = LocalTime.now(clock.withZone(zone));
            if (!endTime.isAfter(now)) {
                throw new AppException("Bookings cannot be made for past time slots", HttpStatus.BAD_REQUEST);
            }
        }

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new AppException("Resource is not available for booking", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new AppException("Expected attendees must be greater than 0", HttpStatus.BAD_REQUEST);
        }

        List<ResourceAvailability> windows =
            availabilityRepository.findByResource_ResourceId(resource.getResourceId());

        boolean insideAnyWindow = windows.stream().anyMatch(w ->
            matchesDate(w.getRecurrenceType(), w.getDayOfWeek(), w.getDayOfMonth(), bookingDate)
                && !startTime.isBefore(w.getStartTime())
                && !endTime.isAfter(w.getEndTime())
        );
        if (!insideAnyWindow) {
            throw new AppException("Requested time slot is outside the resource availability window", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    public boolean hasConflict(UUID resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        return bookingRepository.existsConflict(resourceId, date, startTime, endTime);
    }

    public void validateCreate(
            Location location,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer expectedAttendees
    ) {
        if (endTime == null || startTime == null || !endTime.isAfter(startTime)) {
            throw new AppException("End time must be after start time", HttpStatus.BAD_REQUEST);
        }

        if (bookingDate == null) {
            throw new AppException("Booking date is required", HttpStatus.BAD_REQUEST);
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(clock.withZone(zone));
        if (bookingDate.isBefore(today)) {
            throw new AppException("Bookings cannot be made for past dates", HttpStatus.BAD_REQUEST);
        }
        if (bookingDate.isEqual(today)) {
            LocalTime now = LocalTime.now(clock.withZone(zone));
            if (!endTime.isAfter(now)) {
                throw new AppException("Bookings cannot be made for past time slots", HttpStatus.BAD_REQUEST);
            }
        }

        if (location.getStatus() != ResourceStatus.ACTIVE) {
            throw new AppException("Location is not available for booking", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new AppException("Expected attendees must be greater than 0", HttpStatus.BAD_REQUEST);
        }

        List<LocationAvailability> windows =
            locationAvailabilityRepository.findByLocation_LocationId(location.getLocationId());

        boolean insideAnyWindow = windows.stream().anyMatch(w ->
            matchesDate(w.getRecurrenceType(), w.getDayOfWeek(), w.getDayOfMonth(), bookingDate)
                && !startTime.isBefore(w.getStartTime())
                && !endTime.isAfter(w.getEndTime())
        );
        if (!insideAnyWindow) {
            throw new AppException("Requested time slot is outside the location availability window", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    public boolean hasLocationConflict(UUID locationId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        return bookingRepository.existsLocationConflict(locationId, date, startTime, endTime);
    }

    private boolean matchesDate(
            AvailabilityRecurrenceType recurrenceType,
            DayOfWeek dayOfWeek,
            Integer dayOfMonth,
            LocalDate bookingDate
    ) {
        if (recurrenceType == null) {
            return dayOfWeek == toDayOfWeek(bookingDate);
        }

        return switch (recurrenceType) {
            case DAILY -> true;
            case WEEKLY -> dayOfWeek == toDayOfWeek(bookingDate);
            case MONTHLY -> dayOfMonth != null && dayOfMonth == bookingDate.getDayOfMonth();
        };
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
}


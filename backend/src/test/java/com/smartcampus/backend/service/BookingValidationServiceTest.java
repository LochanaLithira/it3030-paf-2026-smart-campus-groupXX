package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.LocationAvailabilityRepository;
import com.smartcampus.backend.repository.ResourceAvailabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingValidationServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceAvailabilityRepository availabilityRepository;

        @Mock
        private LocationAvailabilityRepository locationAvailabilityRepository;

    private BookingValidationService bookingValidationService;

    @BeforeEach
    void setUp() {
                bookingValidationService = new BookingValidationService(
                                bookingRepository,
                                availabilityRepository,
                                locationAvailabilityRepository
                );
    }

    @Test
    void validateCreate_passesWhenRequestIsWithinAvailability() {
                Resource resource = activeResource();
        LocalDate bookingDate = next(java.time.DayOfWeek.MONDAY);

        when(availabilityRepository.findByResource_ResourceId(eq(resource.getResourceId())))
                .thenReturn(List.of(window(resource, DayOfWeek.MON, "08:00", "18:00")));

        bookingValidationService.validateCreate(
                resource,
                bookingDate,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                25
        );
    }

    @Test
    void validateCreate_throwsWhenEndTimeNotAfterStartTime() {
                Resource resource = activeResource();
        LocalDate bookingDate = next(java.time.DayOfWeek.TUESDAY);

        AppException ex = assertThrows(
                AppException.class,
                () -> bookingValidationService.validateCreate(
                        resource,
                        bookingDate,
                        LocalTime.of(10, 0),
                        LocalTime.of(10, 0),
                        10
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("End time must be after start time", ex.getMessage());
    }

    @Test
    void validateCreate_throwsWhenDateIsInPast() {
                Resource resource = activeResource();
        LocalDate yesterday = LocalDate.now().minusDays(1);

        AppException ex = assertThrows(
                AppException.class,
                () -> bookingValidationService.validateCreate(
                        resource,
                        yesterday,
                        LocalTime.of(9, 0),
                        LocalTime.of(10, 0),
                        5
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Bookings cannot be made for past dates", ex.getMessage());
    }

    @Test
    void validateCreate_throwsWhenResourceIsInactive() {
                Resource resource = activeResource();
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        LocalDate bookingDate = next(java.time.DayOfWeek.WEDNESDAY);

        AppException ex = assertThrows(
                AppException.class,
                () -> bookingValidationService.validateCreate(
                        resource,
                        bookingDate,
                        LocalTime.of(9, 0),
                        LocalTime.of(10, 0),
                        10
                )
        );

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("Resource is not available for booking", ex.getMessage());
    }

    @Test
    void validateCreate_throwsWhenOutsideAvailabilityWindow() {
        Resource resource = activeResource();
        LocalDate bookingDate = next(java.time.DayOfWeek.FRIDAY);

                when(availabilityRepository.findByResource_ResourceId(any()))
                .thenReturn(List.of(window(resource, DayOfWeek.FRI, "09:00", "12:00")));

        AppException ex = assertThrows(
                AppException.class,
                () -> bookingValidationService.validateCreate(
                        resource,
                        bookingDate,
                        LocalTime.of(13, 0),
                        LocalTime.of(14, 0),
                        10
                )
        );

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("Requested time slot is outside the resource availability window", ex.getMessage());
    }

    @Test
    void validateCreate_passesWhenDailyAvailabilityMatchesDate() {
        Resource resource = activeResource();
        LocalDate bookingDate = next(java.time.DayOfWeek.THURSDAY);

        when(availabilityRepository.findByResource_ResourceId(eq(resource.getResourceId())))
                .thenReturn(List.of(windowDaily(resource, "00:00", "23:59")));

        bookingValidationService.validateCreate(
                resource,
                bookingDate,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                10
        );
    }

    @Test
    void validateCreate_passesWhenMonthlyAvailabilityMatchesDate() {
        Resource resource = activeResource();
        LocalDate bookingDate = LocalDate.now().plusMonths(1);
        int dayOfMonth = Math.min(bookingDate.getDayOfMonth(), bookingDate.lengthOfMonth());
        bookingDate = bookingDate.withDayOfMonth(dayOfMonth);

        when(availabilityRepository.findByResource_ResourceId(eq(resource.getResourceId())))
                .thenReturn(List.of(windowMonthly(resource, dayOfMonth, "08:00", "12:00")));

        bookingValidationService.validateCreate(
                resource,
                bookingDate,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                10
        );
    }

    @Test
    void hasConflict_delegatesToRepository() {
        UUID resourceId = UUID.randomUUID();
        LocalDate bookingDate = next(java.time.DayOfWeek.MONDAY);
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(10, 0);

        when(bookingRepository.existsConflict(resourceId, bookingDate, startTime, endTime)).thenReturn(true);
        assertTrue(bookingValidationService.hasConflict(resourceId, bookingDate, startTime, endTime));

        when(bookingRepository.existsConflict(resourceId, bookingDate, startTime, endTime)).thenReturn(false);
        assertFalse(bookingValidationService.hasConflict(resourceId, bookingDate, startTime, endTime));
    }

        private Resource activeResource() {
        return Resource.builder()
                .resourceId(UUID.randomUUID())
                .name("Room A")
                .status(ResourceStatus.ACTIVE)
                .build();
    }

    private ResourceAvailability window(Resource resource, DayOfWeek dayOfWeek, String start, String end) {
        return ResourceAvailability.builder()
                .resource(resource)
                                .recurrenceType(AvailabilityRecurrenceType.WEEKLY)
                .dayOfWeek(dayOfWeek)
                .startTime(LocalTime.parse(start))
                .endTime(LocalTime.parse(end))
                .build();
    }

        private ResourceAvailability windowDaily(Resource resource, String start, String end) {
                return ResourceAvailability.builder()
                                .resource(resource)
                                .recurrenceType(AvailabilityRecurrenceType.DAILY)
                                .startTime(LocalTime.parse(start))
                                .endTime(LocalTime.parse(end))
                                .build();
        }

        private ResourceAvailability windowMonthly(Resource resource, int dayOfMonth, String start, String end) {
                return ResourceAvailability.builder()
                                .resource(resource)
                                .recurrenceType(AvailabilityRecurrenceType.MONTHLY)
                                .dayOfMonth(dayOfMonth)
                                .startTime(LocalTime.parse(start))
                                .endTime(LocalTime.parse(end))
                                .build();
        }

    private LocalDate next(java.time.DayOfWeek dayOfWeek) {
        LocalDate today = LocalDate.now();
        int daysDiff = (dayOfWeek.getValue() - today.getDayOfWeek().getValue() + 7) % 7;
        if (daysDiff == 0) {
            daysDiff = 7;
        }
        return today.plusDays(daysDiff);
    }
}

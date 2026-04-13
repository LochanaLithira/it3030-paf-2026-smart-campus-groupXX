package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.repository.BookingRepository;
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

    private BookingValidationService bookingValidationService;

    @BeforeEach
    void setUp() {
        bookingValidationService = new BookingValidationService(bookingRepository, availabilityRepository);
    }

    @Test
    void validateCreate_passesWhenRequestIsWithinAvailability() {
        Resource resource = activeResource(40);
        LocalDate bookingDate = next(java.time.DayOfWeek.MONDAY);

        when(availabilityRepository.findByResource_ResourceIdAndDayOfWeek(eq(resource.getResourceId()), eq(DayOfWeek.MON)))
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
        Resource resource = activeResource(20);
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
        Resource resource = activeResource(30);
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
        Resource resource = activeResource(40);
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
    void validateCreate_throwsWhenAttendeesExceedCapacity() {
        Resource resource = activeResource(15);
        LocalDate bookingDate = next(java.time.DayOfWeek.THURSDAY);

        AppException ex = assertThrows(
                AppException.class,
                () -> bookingValidationService.validateCreate(
                        resource,
                        bookingDate,
                        LocalTime.of(10, 0),
                        LocalTime.of(11, 0),
                        20
                )
        );

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("Expected attendees exceeds resource capacity", ex.getMessage());
    }

    @Test
    void validateCreate_throwsWhenOutsideAvailabilityWindow() {
        Resource resource = activeResource(30);
        LocalDate bookingDate = next(java.time.DayOfWeek.FRIDAY);

        when(availabilityRepository.findByResource_ResourceIdAndDayOfWeek(any(), eq(DayOfWeek.FRI)))
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

    private Resource activeResource(Integer capacity) {
        return Resource.builder()
                .resourceId(UUID.randomUUID())
                .name("Room A")
                .capacity(capacity)
                .status(ResourceStatus.ACTIVE)
                .build();
    }

    private ResourceAvailability window(Resource resource, DayOfWeek dayOfWeek, String start, String end) {
        return ResourceAvailability.builder()
                .resource(resource)
                .dayOfWeek(dayOfWeek)
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

package com.smartcampus.backend.dto.booking;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record BookingCreateRequest(
        UUID resourceId,

        UUID locationId,

        @NotNull(message = "Booking date is required")
        LocalDate bookingDate,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime,

        @NotBlank(message = "Purpose is required")
        @Size(max = 500, message = "Purpose must be at most 500 characters")
        String purpose,

        @NotNull(message = "Expected attendees is required")
        @Positive(message = "Expected attendees must be greater than 0")
        Integer expectedAttendees
) {
        @AssertTrue(message = "Either resourceId or locationId must be provided, but not both")
        public boolean hasExactlyOneTarget() {
                return (resourceId != null) ^ (locationId != null);
        }
}


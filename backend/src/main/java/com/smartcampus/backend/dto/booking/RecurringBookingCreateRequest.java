package com.smartcampus.backend.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RecurringBookingCreateRequest(
        @NotNull(message = "Resource ID is required")
        UUID resourceId,

        @NotBlank(message = "Recurrence rule is required")
        @Size(max = 255, message = "Recurrence rule must be at most 255 characters")
        String recurrenceRule,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate,

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
) {}

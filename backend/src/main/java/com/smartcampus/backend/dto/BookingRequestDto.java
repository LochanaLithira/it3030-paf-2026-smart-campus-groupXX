package com.smartcampus.backend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record BookingRequestDto(

    @NotNull(message = "Resource ID is required")
    UUID resourceId,

    @NotNull(message = "Booking date is required")
    LocalDate bookingDate,

    @NotNull(message = "Start time is required")
    LocalTime startTime,

    @NotNull(message = "End time is required")
    LocalTime endTime,

    @NotBlank(message = "Purpose is required")
    @Size(max = 500)
    String purpose,

    Integer expectedAttendees
) {}
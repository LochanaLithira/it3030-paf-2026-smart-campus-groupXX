package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingResponseDto(
    UUID bookingId,
    UUID resourceId,
    String resourceName,
    String resourceLocation,
    UUID userId,
    String userName,
    LocalDate bookingDate,
    LocalTime startTime,
    LocalTime endTime,
    String purpose,
    Integer expectedAttendees,
    BookingStatus status,
    String adminReason,
    OffsetDateTime createdAt
) {}
package com.smartcampus.backend.dto.booking;

import com.smartcampus.backend.model.enums.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingResponse(
        UUID bookingId,
        BookingResourceSummary resource,
        BookingUserSummary user,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer expectedAttendees,
        BookingStatus status,
        String rejectionReason,
        UUID reviewedBy,
        OffsetDateTime reviewedAt,
        UUID recurringGroupId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}


package com.smartcampus.backend.dto.auth;

import java.util.List;
import java.util.UUID;

/**
 * Compact user reference used inside other DTOs (e.g. BookingResponse, TicketResponse).
 */
public record UserSummaryResponse(
        UUID userId,
        String fullName,
        String email
) {}

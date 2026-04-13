package com.smartcampus.backend.dto.booking;

import java.util.UUID;

public record BookingUserSummary(
        UUID userId,
        String fullName,
        String email
) {}


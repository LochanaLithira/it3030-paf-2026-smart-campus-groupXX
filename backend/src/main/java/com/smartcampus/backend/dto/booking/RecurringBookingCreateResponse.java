package com.smartcampus.backend.dto.booking;

import java.util.UUID;

public record RecurringBookingCreateResponse(
        UUID groupId,
        int bookingsCreated
) {}

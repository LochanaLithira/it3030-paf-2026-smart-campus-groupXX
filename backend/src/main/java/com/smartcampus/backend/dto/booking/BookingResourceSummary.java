package com.smartcampus.backend.dto.booking;

import com.smartcampus.backend.model.enums.ResourceType;

import java.util.UUID;

public record BookingResourceSummary(
        UUID resourceId,
        UUID locationId,
        String name,
        ResourceType type
) {}


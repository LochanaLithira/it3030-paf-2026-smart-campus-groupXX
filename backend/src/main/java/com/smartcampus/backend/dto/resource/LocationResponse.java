package com.smartcampus.backend.dto.resource;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LocationResponse(
        UUID locationId,
        String buildingName,
        Integer floorNumber,
        String roomNumber,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

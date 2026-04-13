package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record LocationResponse(
        UUID locationId,
        String buildingName,
        Integer floorNumber,
        String roomNumber,
        Integer capacity,
        ResourceType type,
        ResourceStatus status,
        List<ResourceTagResponse> tags,
        List<LocationAvailabilityResponse> availability,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
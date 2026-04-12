package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ResourceResponse(
        UUID resourceId,
        String name,
        ResourceType type,
        Integer capacity,
        ResourceStatus status,
        String description,
        String imageUrl,
        UUID createdBy,
        OffsetDateTime createdAt,
        ResourceLocationResponse location,
        List<ResourceTagResponse> tags,
        List<ResourceAvailabilityResponse> availability
) {}

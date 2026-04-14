package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record ResourceRequest(
        @NotBlank(message = "Resource name is required")
        @Size(max = 150, message = "Name must be at most 150 characters")
        String name,

        @NotNull(message = "Resource type is required")
        ResourceType type,

        ResourceStatus status,

        List<UUID> tagIds,

        @Valid
        List<ResourceAvailabilityRequest> availability
) {}
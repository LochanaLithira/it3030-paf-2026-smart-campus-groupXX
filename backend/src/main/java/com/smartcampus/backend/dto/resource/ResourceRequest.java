package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be greater than zero")
        Integer capacity,

        UUID locationId,

        ResourceStatus status,

        @Size(max = 5000, message = "Description must be at most 5000 characters")
        String description,

        @org.hibernate.validator.constraints.URL(message = "Image URL must be a valid URL")
        @Size(max = 2000, message = "Image URL must be at most 2000 characters")
        String imageUrl,

        List<UUID> tagIds,

        @Valid
        List<ResourceAvailabilityRequest> availability
) {}
package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record LocationRequest(
        @NotBlank(message = "Building name is required")
        @Size(max = 100, message = "Building name must be at most 100 characters")
        String buildingName,

        @NotNull(message = "Floor number is required")
        @Min(value = -10, message = "Floor number is too small")
        @Max(value = 300, message = "Floor number is too large")
        Integer floorNumber,

        @Size(max = 20, message = "Room number must be at most 20 characters")
        String roomNumber,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be greater than zero")
        Integer capacity,

        @NotNull(message = "Location type is required")
        ResourceType type,

        @NotNull(message = "Location status is required")
        ResourceStatus status,

        List<UUID> tagIds,

        @Valid
        List<LocationAvailabilityRequest> availability
) {}
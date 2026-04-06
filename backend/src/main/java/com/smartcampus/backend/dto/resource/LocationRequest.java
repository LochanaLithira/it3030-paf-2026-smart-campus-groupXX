package com.smartcampus.backend.dto.resource;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LocationRequest(
        @NotBlank(message = "Building name is required")
        @Size(max = 100, message = "Building name must be at most 100 characters")
        String buildingName,

        @Min(value = -10, message = "Floor number is too small")
        @Max(value = 300, message = "Floor number is too large")
        Integer floorNumber,

        @Size(max = 20, message = "Room number must be at most 20 characters")
        String roomNumber,

        String description
) {}

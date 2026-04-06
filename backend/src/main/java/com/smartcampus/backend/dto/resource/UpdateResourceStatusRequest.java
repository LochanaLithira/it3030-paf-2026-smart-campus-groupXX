package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateResourceStatusRequest(
        @NotNull(message = "Status is required")
        ResourceStatus status
) {}

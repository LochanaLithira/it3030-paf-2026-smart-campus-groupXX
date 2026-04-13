package com.smartcampus.backend.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResourceTagUpdateRequest(
        @NotBlank(message = "Tag name is required")
        @Size(max = 50, message = "Tag name must be at most 50 characters")
        String tagName
) {}

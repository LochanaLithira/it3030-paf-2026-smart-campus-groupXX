package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TicketRequest(
    @NotNull(message = "Resource ID is required")
    UUID resourceId,

    @NotNull(message = "Category is required")
    TicketCategory category,

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    String description,

    @NotNull(message = "Priority is required")
    TicketPriority priority
) {}

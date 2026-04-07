package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.model.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketStatusUpdateRequest(
    @NotNull(message = "Status is required")
    TicketStatus newStatus,

    @Size(max = 2000, message = "Resolution notes must not exceed 2000 characters")
    String resolutionNotes,

    @Size(max = 500, message = "Note must not exceed 500 characters")
    String note
) {}

package com.smartcampus.backend.dto.ticket;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record TicketAssignRequest(
    @NotNull(message = "Assigned technician ID is required")
    UUID assignedTechId,

    @Future(message = "Due date must be in the future")
    LocalDate dueDate
) {}

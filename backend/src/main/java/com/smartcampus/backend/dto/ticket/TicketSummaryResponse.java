package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TicketSummaryResponse(
    UUID ticketId,
    TicketResourceResponse resource,
    UserSummaryResponse reporter,
    UserSummaryResponse assignedTech,
    TicketCategory category,
    String description,
    TicketPriority priority,
    TicketStatus status,
    String preferredContactEmail,      // PDF requirement (Member 3)
    String preferredContactPhone,      // PDF requirement (Member 3)
    Long timeToFirstResponseSeconds,
    Long timeToResolutionSeconds,
    int attachmentCount,
    int commentCount,
    LocalDate dueDate,
    Instant createdAt,
    Instant updatedAt
) {}

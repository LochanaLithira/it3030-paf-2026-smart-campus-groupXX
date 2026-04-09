package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;

import java.time.Instant;
import java.util.UUID;

public record TicketSummaryResponse(
    UUID ticketId,
    String resourceName,
    UUID resourceId,
    UserSummaryResponse reporter,
    UserSummaryResponse assignedTech,
    TicketCategory category,
    String description,
    TicketPriority priority,
    TicketStatus status,
    String preferredContactEmail,      // PDF requirement (Member 3)
    String preferredContactPhone,      // PDF requirement (Member 3)
    int attachmentCount,
    int commentCount,
    Instant createdAt,
    Instant updatedAt
) {}

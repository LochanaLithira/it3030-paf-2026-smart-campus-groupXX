package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;
import com.smartcampus.backend.dto.resource.ResourceLocationResponse;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
    UUID ticketId,
    TicketResourceResponse resource,
    UserSummaryResponse reporter,
    UserSummaryResponse assignedTech,
    TicketCategory category,
    String description,
    TicketPriority priority,
    TicketStatus status,
    String resolutionNotes,
    LocalDate dueDate,
    Instant resolvedAt,
    List<TicketAttachmentResponse> attachments,
    List<TicketCommentResponse> comments,
    List<StatusHistoryResponse> statusHistory,
    Instant createdAt,
    Instant updatedAt
) {}

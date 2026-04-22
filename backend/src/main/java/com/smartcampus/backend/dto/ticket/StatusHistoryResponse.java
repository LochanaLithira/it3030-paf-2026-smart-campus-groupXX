package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;
import com.smartcampus.backend.model.enums.TicketStatus;

import java.time.Instant;
import java.util.UUID;

public record StatusHistoryResponse(
    UUID historyId,
    UserSummaryResponse changedBy,
    TicketStatus oldStatus,
    TicketStatus newStatus,
    String notes,
    Instant changedAt
) {}

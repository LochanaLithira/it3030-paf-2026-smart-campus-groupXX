package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record TicketCommentResponse(
    UUID commentId,
    UserSummaryResponse author,
    String content,
    Instant createdAt,
    Instant updatedAt
) {}

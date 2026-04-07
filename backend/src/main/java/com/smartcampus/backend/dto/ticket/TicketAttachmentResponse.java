package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.auth.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record TicketAttachmentResponse(
    UUID attachmentId,
    String fileUrl,
    String fileName,
    Integer fileSize,
    UserSummaryResponse uploadedBy,
    Instant uploadedAt
) {}

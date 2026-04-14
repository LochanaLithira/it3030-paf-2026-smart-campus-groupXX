package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.enums.NotificationCategory;
import com.smartcampus.backend.model.enums.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationDTO(
        UUID id,
        String recipientUserId,
        NotificationCategory category,
        NotificationType type,
        String title,
        String message,
        boolean isRead,
        OffsetDateTime createdAt,
        String referenceId,
        String referenceType
) {}

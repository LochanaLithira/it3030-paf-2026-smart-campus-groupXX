package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.enums.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID notificationId,
        String title,
        String message,
        NotificationType type,
        boolean isRead,
        UUID relatedEntityId,
        OffsetDateTime createdAt
) {}

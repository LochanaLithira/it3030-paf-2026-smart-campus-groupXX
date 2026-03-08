package com.smartcampus.backend.dto.notification;

import java.util.List;

/**
 * Extended paginated notification list that includes the unread count.
 */
public record NotificationPageResponse(
        List<NotificationResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        long unreadCount
) {}

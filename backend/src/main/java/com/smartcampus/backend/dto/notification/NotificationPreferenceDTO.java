package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.enums.NotificationCategory;

import java.util.UUID;

public record NotificationPreferenceDTO(
        UUID id,
        String userId,
        NotificationCategory category,
        boolean enabled
) {}

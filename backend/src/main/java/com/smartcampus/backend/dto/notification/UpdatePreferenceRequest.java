package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.enums.NotificationCategory;
import jakarta.validation.constraints.NotNull;

public record UpdatePreferenceRequest(
        @NotNull NotificationCategory category,
        @NotNull Boolean enabled
) {}

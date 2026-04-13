package com.smartcampus.backend.dto.booking;

import java.time.LocalTime;
import java.util.UUID;

public record BookingSuggestion(
        SuggestionKind kind,
        UUID resourceId,
        String resourceName,
        LocalTime startTime,
        LocalTime endTime
) {
    public enum SuggestionKind {
        SAME_RESOURCE,
        OTHER_RESOURCE
    }
}


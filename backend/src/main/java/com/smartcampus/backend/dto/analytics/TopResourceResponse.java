package com.smartcampus.backend.dto.analytics;

public record TopResourceResponse(
    String resourceName,
    Integer bookingCount
) {}

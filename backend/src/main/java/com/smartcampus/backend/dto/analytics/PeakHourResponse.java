package com.smartcampus.backend.dto.analytics;

public record PeakHourResponse(
    Integer hourOfDay,
    Integer bookingCount
) {}

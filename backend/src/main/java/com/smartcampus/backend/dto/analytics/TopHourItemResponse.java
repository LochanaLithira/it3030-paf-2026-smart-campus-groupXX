package com.smartcampus.backend.dto.analytics;

public record TopHourItemResponse(
    String itemName,
    Integer bookingCount
) {}

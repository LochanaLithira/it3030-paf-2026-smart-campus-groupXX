package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.DayOfWeek;

public record ResourceHeatmapAvailabilityWindow(
        DayOfWeek day,
        String startTime,
        String endTime
) {}

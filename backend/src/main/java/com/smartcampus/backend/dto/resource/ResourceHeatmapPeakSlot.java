package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.DayOfWeek;

public record ResourceHeatmapPeakSlot(
        DayOfWeek day,
        String hourSlot,
        Integer utilizationPct
) {}

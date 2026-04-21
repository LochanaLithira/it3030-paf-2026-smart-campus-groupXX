package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.DayOfWeek;

import java.util.Map;

public record ResourceHeatmapRow(
        String hourSlot,
        Map<DayOfWeek, Integer> days,
        Map<DayOfWeek, Integer> bookingCounts
) {}

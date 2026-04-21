package com.smartcampus.backend.dto.resource;

public record ResourceHeatmapSummary(
        ResourceHeatmapPeakSlot peakSlot,
        Integer avgUtilizationPct,
        Integer idleSlots
) {}

package com.smartcampus.backend.dto.resource;

import java.time.LocalDate;

public record ResourceHeatmapResolvedPeriod(
        String key,
        LocalDate startDate,
        LocalDate endDate
) {}

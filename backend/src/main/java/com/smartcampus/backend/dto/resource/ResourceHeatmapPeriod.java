package com.smartcampus.backend.dto.resource;

public enum ResourceHeatmapPeriod {
    THIS_WEEK,
    LAST_WEEK,
    THIS_MONTH,
    CUSTOM;

    public static ResourceHeatmapPeriod fromQueryParam(String period) {
        if (period == null || period.isBlank()) {
            return THIS_WEEK;
        }

        return switch (period.trim().toLowerCase()) {
            case "this_week" -> THIS_WEEK;
            case "last_week" -> LAST_WEEK;
            case "this_month" -> THIS_MONTH;
            default -> throw new IllegalArgumentException("Unsupported period: " + period);
        };
    }
}

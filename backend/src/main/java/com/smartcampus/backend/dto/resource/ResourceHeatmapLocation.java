package com.smartcampus.backend.dto.resource;

public record ResourceHeatmapLocation(
        String buildingName,
        Integer floorNumber,
        String roomNumber
) {}

package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;

import java.util.List;
import java.util.UUID;

public record ResourceHeatmapResponse(
        UUID resourceId,
        String resourceName,
        ResourceType resourceType,
        ResourceStatus resourceStatus,
        ResourceHeatmapLocation location,
        ResourceHeatmapResolvedPeriod resolvedPeriod,
        ResourceHeatmapSummary summary,
        List<ResourceHeatmapAvailabilityWindow> availabilityWindows,
        List<ResourceHeatmapRow> heatmap
) {}

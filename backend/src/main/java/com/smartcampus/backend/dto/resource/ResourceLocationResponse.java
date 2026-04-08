package com.smartcampus.backend.dto.resource;

import java.util.UUID;

public record ResourceLocationResponse(
        UUID locationId,
        String buildingName,
        Integer floorNumber,
        String roomNumber
) {}

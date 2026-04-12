package com.smartcampus.backend.dto.ticket;

import com.smartcampus.backend.dto.resource.ResourceLocationResponse;

import java.util.UUID;

public record TicketResourceResponse(
    UUID resourceId,
    String name,
    String type,
    ResourceLocationResponse location
) {}

package com.smartcampus.backend.dto.ticket;

import java.util.UUID;

public record TicketResourceResponse(
    UUID resourceId,
    UUID locationId,
    String name,
    String type
) {}

package com.smartcampus.backend.dto.resource;

import java.util.UUID;

public record ResourceTagResponse(
        UUID tagId,
        String tagName
) {}
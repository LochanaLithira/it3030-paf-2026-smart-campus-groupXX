package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.DayOfWeek;

import java.time.LocalTime;
import java.util.UUID;

public record LocationAvailabilityResponse(
        UUID availId,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {}

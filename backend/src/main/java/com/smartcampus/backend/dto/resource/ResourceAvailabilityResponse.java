package com.smartcampus.backend.dto.resource;

import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.DayOfWeek;

import java.time.LocalTime;
import java.util.UUID;

public record ResourceAvailabilityResponse(
        UUID availId,
        AvailabilityRecurrenceType recurrenceType,
        DayOfWeek dayOfWeek,
        Integer dayOfMonth,
        LocalTime startTime,
        LocalTime endTime
) {}
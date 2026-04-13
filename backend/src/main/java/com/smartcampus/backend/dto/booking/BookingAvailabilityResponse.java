package com.smartcampus.backend.dto.booking;

import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record BookingAvailabilityResponse(
        LocalDate date,
        DayOfWeek dayOfWeek,
        TimeWindow resourceAvailability,
        List<BookedSlot> bookedSlots
) {
    public record TimeWindow(LocalTime startTime, LocalTime endTime) {}
    public record BookedSlot(LocalTime startTime, LocalTime endTime, BookingStatus status) {}
}


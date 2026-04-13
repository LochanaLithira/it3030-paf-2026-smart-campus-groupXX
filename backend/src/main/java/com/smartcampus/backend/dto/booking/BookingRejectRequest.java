package com.smartcampus.backend.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookingRejectRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 255, message = "Rejection reason must be at most 255 characters")
        String rejectionReason
) {}


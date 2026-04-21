package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.analytics.PeakHourResponse;
import com.smartcampus.backend.dto.analytics.TopResourceResponse;
import com.smartcampus.backend.dto.analytics.TopHourItemResponse;
import com.smartcampus.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Platform analytics and metrics (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/top-resources")
    @PreAuthorize("hasAuthority('locations.view_all') or hasAuthority('bookings.view_all')")
    @Operation(summary = "Get top booked resources", description = "Returns the most frequently booked resources")
    public ResponseEntity<List<TopResourceResponse>> getTopResources(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getTopResources(limit));
    }

    @GetMapping("/peak-hours")
    @PreAuthorize("hasAuthority('locations.view_all') or hasAuthority('bookings.view_all')")
    @Operation(summary = "Get peak booking hours", description = "Returns heat map data for overall peak booking hours")
    public ResponseEntity<List<PeakHourResponse>> getPeakBookingHours() {
        return ResponseEntity.ok(analyticsService.getPeakBookingHours());
    }

    @GetMapping("/peak-hours/{hour}/top-items")
    @PreAuthorize("hasAuthority('locations.view_all') or hasAuthority('bookings.view_all')")
    @Operation(summary = "Get top items for specific hour", description = "Returns the top resources/locations booked during a peak hour")
    public ResponseEntity<List<TopHourItemResponse>> getTopItemsForHour(
            @PathVariable int hour,
            @RequestParam(defaultValue = "3") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getTopItemsForHour(hour, limit));
    }
}

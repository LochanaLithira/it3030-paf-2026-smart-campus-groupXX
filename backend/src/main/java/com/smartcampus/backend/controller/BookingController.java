package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.booking.BookingAvailabilityResponse;
import com.smartcampus.backend.dto.booking.BookingCreateRequest;
import com.smartcampus.backend.dto.booking.BookingRejectRequest;
import com.smartcampus.backend.dto.booking.BookingResponse;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateRequest;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateResponse;
import com.smartcampus.backend.dto.common.PageResponse;
import com.smartcampus.backend.model.enums.BookingStatus;
import com.smartcampus.backend.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Resource booking management")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAuthority('bookings.create')")
    @Operation(summary = "Create booking request", description = "Create a booking request. New bookings start as PENDING.")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingCreateRequest request) {
        return ResponseEntity.status(201).body(bookingService.createBooking(request));
    }

    @PostMapping("/recurring")
    @PreAuthorize("hasAuthority('bookings.create')")
    @Operation(summary = "Create recurring booking series", description = "Create weekly recurring booking requests.")
    public ResponseEntity<RecurringBookingCreateResponse> createRecurringBooking(
            @Valid @RequestBody RecurringBookingCreateRequest request
    ) {
        return ResponseEntity.status(201).body(bookingService.createRecurringBooking(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all')")
    @Operation(summary = "List bookings", description = "List bookings with role-based filtering and pagination.")
    public ResponseEntity<PageResponse<BookingResponse>> listBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(bookingService.listBookings(
                status, resourceId, userId, locationId, fromDate, toDate, pageable
        ));
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all')")
    @Operation(summary = "Get booking details")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }

    @PatchMapping("/{bookingId}/approve")
    @PreAuthorize("hasAuthority('bookings.approve')")
    @Operation(summary = "Approve booking (admin)")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.approveBooking(bookingId));
    }

    @PatchMapping("/{bookingId}/reject")
    @PreAuthorize("hasAuthority('bookings.approve')")
    @Operation(summary = "Reject booking (admin)")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable UUID bookingId,
            @Valid @RequestBody BookingRejectRequest request
    ) {
        return ResponseEntity.ok(bookingService.rejectBooking(bookingId, request));
    }

    @PatchMapping("/{bookingId}/cancel")
    @PreAuthorize("hasAuthority('bookings.cancel_own') or hasAuthority('bookings.cancel_any')")
    @Operation(summary = "Cancel booking")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasAuthority('bookings.create') or hasAuthority('bookings.view_own') or hasAuthority('bookings.view_all')")
    @Operation(summary = "Check availability for resource+date")
    public ResponseEntity<BookingAvailabilityResponse> availability(
            @RequestParam UUID resourceId,
            @RequestParam LocalDate date
    ) {
        return ResponseEntity.ok(bookingService.getAvailability(resourceId, date));
    }
}

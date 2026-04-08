package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.BookingRequestDto;
import com.smartcampus.backend.dto.BookingResponseDto;
import com.smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDto> createBooking(
        @AuthenticationPrincipal UUID userId,
        @Valid @RequestBody BookingRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(bookingService.createBooking(userId, request));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponseDto>> getMyBookings(
        @AuthenticationPrincipal UUID userId
    ) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('bookings.read')")
    public ResponseEntity<List<BookingResponseDto>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDto> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('bookings.approve')")
    public ResponseEntity<BookingResponseDto> approveBooking(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('bookings.approve')")
    public ResponseEntity<BookingResponseDto> rejectBooking(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, body.get("reason")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDto> cancelBooking(
        @PathVariable UUID id,
        @AuthenticationPrincipal UUID userId
    ) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, userId));
    }
}

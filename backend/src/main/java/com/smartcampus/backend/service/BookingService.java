package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequestDto;
import com.smartcampus.backend.dto.BookingResponseDto;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    private BookingResponseDto toDto(Booking b) {
        return new BookingResponseDto(
            b.getBookingId(),
            b.getResource().getResourceId(),
            b.getResource().getName(),
            b.getResource().getLocation(),
            b.getUser().getUserId(),
            b.getUser().getFullName(),
            b.getBookingDate(),
            b.getStartTime(),
            b.getEndTime(),
            b.getPurpose(),
            b.getExpectedAttendees(),
            b.getStatus(),
            b.getAdminReason(),
            b.getCreatedAt()
        );
    }

    @Transactional
    public BookingResponseDto createBooking(UUID userId, BookingRequestDto req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Resource resource = resourceRepository.findById(req.resourceId())
            .orElseThrow(() -> new AppException("Resource not found", HttpStatus.NOT_FOUND));

        boolean conflict = bookingRepository.existsConflict(
            req.resourceId(), req.bookingDate(), req.startTime(), req.endTime()
        );
        if (conflict) {
            throw new AppException(
                "This resource is already booked for the selected time slot",
                HttpStatus.CONFLICT
            );
        }

        Booking booking = Booking.builder()
            .user(user)
            .resource(resource)
            .bookingDate(req.bookingDate())
            .startTime(req.startTime())
            .endTime(req.endTime())
            .purpose(req.purpose())
            .expectedAttendees(req.expectedAttendees())
            .status(BookingStatus.PENDING)
            .build();

        return toDto(bookingRepository.save(booking));
    }

    public List<BookingResponseDto> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUser_UserId(userId)
            .stream().map(this::toDto).toList();
    }

    public List<BookingResponseDto> getAllBookings() {
        return bookingRepository.findAll()
            .stream().map(this::toDto).toList();
    }

    public BookingResponseDto getBookingById(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        return toDto(booking);
    }

    @Transactional
    public BookingResponseDto approveBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException("Only PENDING bookings can be approved", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(BookingStatus.APPROVED);
        return toDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDto rejectBooking(UUID bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException("Only PENDING bookings can be rejected", HttpStatus.BAD_REQUEST);
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(reason);
        return toDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDto cancelBooking(UUID bookingId, UUID userId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (!booking.getUser().getUserId().equals(userId)) {
            throw new AppException("You can only cancel your own bookings", HttpStatus.FORBIDDEN);
        }
        if (booking.getStatus() != BookingStatus.APPROVED &&
            booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(
                "Only PENDING or APPROVED bookings can be cancelled",
                HttpStatus.BAD_REQUEST
            );
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return toDto(bookingRepository.save(booking));
    }
}

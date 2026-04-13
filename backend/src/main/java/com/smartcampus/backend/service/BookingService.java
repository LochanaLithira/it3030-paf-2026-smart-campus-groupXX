package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.booking.BookingAvailabilityResponse;
import com.smartcampus.backend.dto.booking.BookingCreateRequest;
import com.smartcampus.backend.dto.booking.BookingRejectRequest;
import com.smartcampus.backend.dto.booking.BookingResponse;
import com.smartcampus.backend.dto.booking.BookingResourceSummary;
import com.smartcampus.backend.dto.booking.BookingUserSummary;
import com.smartcampus.backend.dto.common.PageResponse;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.BookingStatus;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.NotificationType;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceAvailabilityRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final ResourceAvailabilityRepository availabilityRepository;
    private final BookingValidationService bookingValidationService;
    private final BookingSuggestionService bookingSuggestionService;
    private final NotificationService notificationService;

    private BookingResponse toResponse(Booking b) {
        return new BookingResponse(
                b.getBookingId(),
                new BookingResourceSummary(
                        b.getResource().getResourceId(),
                        b.getResource().getName(),
                        b.getResource().getType()
                ),
                new BookingUserSummary(
                        b.getUser().getUserId(),
                        b.getUser().getFullName(),
                        b.getUser().getEmail()
                ),
                b.getBookingDate(),
                b.getStartTime(),
                b.getEndTime(),
                b.getPurpose(),
                b.getExpectedAttendees(),
                b.getStatus(),
                b.getRejectionReason(),
                b.getReviewedBy() != null ? b.getReviewedBy().getUserId() : null,
                b.getReviewedAt(),
                b.getRecurringGroupId(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    @Transactional
    public BookingResponse createBooking(BookingCreateRequest req) {
        UUID userId = SecurityUtils.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Resource resource = resourceRepository.findById(req.resourceId())
                .orElseThrow(() -> new AppException("Resource not found", HttpStatus.NOT_FOUND));

        bookingValidationService.validateCreate(
                resource,
                req.bookingDate(),
                req.startTime(),
                req.endTime(),
                req.expectedAttendees()
        );

        boolean conflict = bookingValidationService.hasConflict(
                req.resourceId(), req.bookingDate(), req.startTime(), req.endTime()
        );
        if (conflict) {
            throw new BookingConflictException(
                    "This resource is already booked for the selected time slot",
                    bookingSuggestionService.suggest(resource, req.bookingDate(), req.startTime(), req.endTime())
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

        Booking saved = bookingRepository.save(booking);

        // Notify admins
        for (UUID adminId : userRepository.findAllAdminUserIds()) {
            notificationService.create(
                    adminId,
                    "Booking Requested",
                    user.getFullName() + " requested " + resource.getName() + " on " + req.bookingDate(),
                    NotificationType.BOOKING_CREATED,
                    saved.getBookingId()
            );
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> listBookings(
            BookingStatus status,
            UUID resourceId,
            UUID userId,
            UUID locationId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        boolean canViewAll = SecurityUtils.getCurrentPrincipal().getPermissions().contains("bookings.view_all");
        UUID effectiveUserId = canViewAll ? userId : SecurityUtils.getCurrentUserId();

        Page<Booking> page = bookingRepository.findAllWithFilters(
                status,
                resourceId,
                effectiveUserId,
                locationId,
                fromDate,
                toDate,
                pageable
        );
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean canViewAll = SecurityUtils.getCurrentPrincipal().getPermissions().contains("bookings.view_all");
        if (!canViewAll && !booking.getUser().getUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to view this booking", HttpStatus.FORBIDDEN);
        }

        return toResponse(booking);
    }

    @Transactional
    public BookingResponse approveBooking(UUID bookingId) {
        UUID reviewerId = SecurityUtils.getCurrentUserId();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException("Only PENDING bookings can be approved", HttpStatus.BAD_REQUEST);
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(reviewer);
        booking.setReviewedAt(OffsetDateTime.now());
        booking.setRejectionReason(null);

        Booking saved = bookingRepository.save(booking);

        notificationService.create(
                saved.getUser().getUserId(),
                "Booking Approved",
                "Your booking for " + saved.getResource().getName() + " on " + saved.getBookingDate() + " was approved.",
                NotificationType.BOOKING_APPROVED,
                saved.getBookingId()
        );

        return toResponse(saved);
    }

    @Transactional
    public BookingResponse rejectBooking(UUID bookingId, BookingRejectRequest req) {
        UUID reviewerId = SecurityUtils.getCurrentUserId();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException("Only PENDING bookings can be rejected", HttpStatus.BAD_REQUEST);
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(req.rejectionReason());
        booking.setReviewedBy(reviewer);
        booking.setReviewedAt(OffsetDateTime.now());

        Booking saved = bookingRepository.save(booking);

        notificationService.create(
                saved.getUser().getUserId(),
                "Booking Rejected",
                "Your booking for " + saved.getResource().getName() + " on " + saved.getBookingDate() + " was rejected.",
                NotificationType.BOOKING_REJECTED,
                saved.getBookingId()
        );

        return toResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean canCancelAny = SecurityUtils.getCurrentPrincipal().getPermissions().contains("bookings.cancel_any");

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));

        if (!canCancelAny && !booking.getUser().getUserId().equals(currentUserId)) {
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

        Booking saved = bookingRepository.save(booking);

        if (canCancelAny && !saved.getUser().getUserId().equals(currentUserId)) {
            notificationService.create(
                    saved.getUser().getUserId(),
                    "Booking Cancelled",
                    "An admin cancelled your booking for " + saved.getResource().getName() + " on " + saved.getBookingDate() + ".",
                    NotificationType.BOOKING_CANCELLED,
                    saved.getBookingId()
            );
        } else {
            for (UUID adminId : userRepository.findAllAdminUserIds()) {
                notificationService.create(
                        adminId,
                        "Booking Cancelled",
                        saved.getUser().getFullName() + " cancelled a booking for " + saved.getResource().getName() + " on " + saved.getBookingDate() + ".",
                        NotificationType.BOOKING_CANCELLED,
                        saved.getBookingId()
                );
            }
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookingAvailabilityResponse getAvailability(UUID resourceId, LocalDate date) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new AppException("Resource not found", HttpStatus.NOT_FOUND));

        DayOfWeek dayOfWeek = toDayOfWeek(date);
        var windows = availabilityRepository.findByResource_ResourceIdAndDayOfWeek(resourceId, dayOfWeek);
        BookingAvailabilityResponse.TimeWindow window = windows.isEmpty()
                ? null
                : new BookingAvailabilityResponse.TimeWindow(windows.getFirst().getStartTime(), windows.getFirst().getEndTime());

        var bookings = bookingRepository.findActiveByResourceAndDate(resourceId, date);
        var bookedSlots = bookings.stream()
                .map(b -> new BookingAvailabilityResponse.BookedSlot(b.getStartTime(), b.getEndTime(), b.getStatus()))
                .toList();

        return new BookingAvailabilityResponse(date, dayOfWeek, window, bookedSlots);
    }

    private DayOfWeek toDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> DayOfWeek.MON;
            case TUESDAY -> DayOfWeek.TUE;
            case WEDNESDAY -> DayOfWeek.WED;
            case THURSDAY -> DayOfWeek.THU;
            case FRIDAY -> DayOfWeek.FRI;
            case SATURDAY -> DayOfWeek.SAT;
            case SUNDAY -> DayOfWeek.SUN;
        };
    }
}

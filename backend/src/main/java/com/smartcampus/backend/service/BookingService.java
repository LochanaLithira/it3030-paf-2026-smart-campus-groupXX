package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.booking.BookingAvailabilityResponse;
import com.smartcampus.backend.dto.booking.BookingCreateRequest;
import com.smartcampus.backend.dto.booking.BookingRejectRequest;
import com.smartcampus.backend.dto.booking.BookingResponse;
import com.smartcampus.backend.dto.booking.BookingResourceSummary;
import com.smartcampus.backend.dto.booking.BookingUserSummary;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateRequest;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateResponse;
import com.smartcampus.backend.dto.common.PageResponse;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.Location;
import com.smartcampus.backend.model.RecurringBookingGroup;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.BookingStatus;
import com.smartcampus.backend.model.enums.DayOfWeek;
import com.smartcampus.backend.model.enums.NotificationType;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.LocationRepository;
import com.smartcampus.backend.repository.RecurringBookingGroupRepository;
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
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RecurringBookingGroupRepository recurringBookingGroupRepository;
    private final ResourceRepository resourceRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ResourceAvailabilityRepository availabilityRepository;
    private final BookingValidationService bookingValidationService;
    private final BookingSuggestionService bookingSuggestionService;
    private final NotificationService notificationService;

    private BookingResponse toResponse(Booking b) {
        return new BookingResponse(
                b.getBookingId(),
            toTargetSummary(b),
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

    private BookingResourceSummary toTargetSummary(Booking booking) {
        if (booking.getResource() != null) {
            return new BookingResourceSummary(
                    booking.getResource().getResourceId(),
                    null,
                    booking.getResource().getName(),
                    booking.getResource().getType()
            );
        }

        if (booking.getLocation() != null) {
            return new BookingResourceSummary(
                    null,
                    booking.getLocation().getLocationId(),
                    formatLocationName(booking.getLocation()),
                    booking.getLocation().getType()
            );
        }

        throw new AppException("Booking has no target resource or location", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String formatLocationName(Location location) {
        String room = location.getRoomNumber() == null || location.getRoomNumber().isBlank()
                ? ""
                : ", Room " + location.getRoomNumber();
        return location.getBuildingName() + " - Floor " + location.getFloorNumber() + room;
    }

    private String targetName(Booking booking) {
        if (booking.getResource() != null) {
            return booking.getResource().getName();
        }
        if (booking.getLocation() != null) {
            return formatLocationName(booking.getLocation());
        }
        return "Unknown target";
    }

    @Transactional
    public BookingResponse createBooking(BookingCreateRequest req) {
        UUID userId = SecurityUtils.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Resource resource = null;
        Location location = null;

        if (req.resourceId() != null) {
            resource = resourceRepository.findById(req.resourceId())
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
        } else {
            location = locationRepository.findById(req.locationId())
                .orElseThrow(() -> new AppException("Location not found", HttpStatus.NOT_FOUND));

            bookingValidationService.validateCreate(
                location,
                req.bookingDate(),
                req.startTime(),
                req.endTime(),
                req.expectedAttendees()
            );

            boolean conflict = bookingValidationService.hasLocationConflict(
                req.locationId(), req.bookingDate(), req.startTime(), req.endTime()
            );
            if (conflict) {
            throw new BookingConflictException(
                "This location is already booked for the selected time slot",
                List.of()
            );
            }
        }

        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
            .location(location)
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
                    user.getFullName() + " requested " + targetName(saved) + " on " + req.bookingDate(),
                    NotificationType.BOOKING_CREATED,
                    saved.getBookingId()
            );
        }

        return toResponse(saved);
    }

    @Transactional
    public RecurringBookingCreateResponse createRecurringBooking(RecurringBookingCreateRequest req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        Resource resource = resourceRepository.findById(req.resourceId())
                .orElseThrow(() -> new AppException("Resource not found", HttpStatus.NOT_FOUND));

        validateRecurringRequest(req);
        Set<java.time.DayOfWeek> allowedDays = parseWeeklyRule(req.recurrenceRule());
        List<LocalDate> occurrenceDates = generateOccurrenceDates(req.startDate(), req.endDate(), allowedDays);

        for (LocalDate date : occurrenceDates) {
            bookingValidationService.validateCreate(
                    resource,
                    date,
                    req.startTime(),
                    req.endTime(),
                    req.expectedAttendees()
            );

            boolean conflict = bookingValidationService.hasConflict(
                    req.resourceId(),
                    date,
                    req.startTime(),
                    req.endTime()
            );
            if (conflict) {
                throw new BookingConflictException(
                        "This resource is already booked for one or more selected recurring time slots",
                        bookingSuggestionService.suggest(resource, date, req.startTime(), req.endTime())
                );
            }
        }

        RecurringBookingGroup group = recurringBookingGroupRepository.save(
                RecurringBookingGroup.builder()
                        .user(user)
                        .resource(resource)
                        .recurrenceRule(req.recurrenceRule().trim())
                        .startDate(req.startDate())
                        .endDate(req.endDate())
                        .startTime(req.startTime())
                        .endTime(req.endTime())
                        .purpose(req.purpose())
                        .build()
        );

        List<Booking> bookings = occurrenceDates.stream()
                .map(date -> Booking.builder()
                        .user(user)
                        .resource(resource)
                        .bookingDate(date)
                        .startTime(req.startTime())
                        .endTime(req.endTime())
                        .purpose(req.purpose())
                        .expectedAttendees(req.expectedAttendees())
                        .status(BookingStatus.PENDING)
                        .recurringGroupId(group.getGroupId())
                        .build())
                .toList();

        bookingRepository.saveAll(bookings);

        for (UUID adminId : userRepository.findAllAdminUserIds()) {
            notificationService.create(
                    adminId,
                    "Recurring Booking Requested",
                    user.getFullName() + " requested recurring bookings for " + resource.getName()
                            + " from " + req.startDate() + " to " + req.endDate() + ".",
                    NotificationType.BOOKING_CREATED,
                    group.getGroupId()
            );
        }

        return new RecurringBookingCreateResponse(group.getGroupId(), bookings.size());
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> listBookings(
            BookingStatus status,
            UUID resourceId,
            UUID locationId,
            UUID userId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        boolean canViewAll = SecurityUtils.getCurrentPrincipal().getPermissions().contains("bookings.view_all");
        UUID effectiveUserId = canViewAll ? userId : SecurityUtils.getCurrentUserId();

        Page<Booking> page = bookingRepository.findAllWithFilters(
                status,
                resourceId,
            locationId,
                effectiveUserId,
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
            "Your booking for " + targetName(saved) + " on " + saved.getBookingDate() + " was approved.",
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
            "Your booking for " + targetName(saved) + " on " + saved.getBookingDate() + " was rejected.",
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
                    "An admin cancelled your booking for " + targetName(saved) + " on " + saved.getBookingDate() + ".",
                    NotificationType.BOOKING_CANCELLED,
                    saved.getBookingId()
            );
        } else {
            for (UUID adminId : userRepository.findAllAdminUserIds()) {
                notificationService.create(
                        adminId,
                        "Booking Cancelled",
                        saved.getUser().getFullName() + " cancelled a booking for " + targetName(saved) + " on " + saved.getBookingDate() + ".",
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
        var windows = availabilityRepository.findByResource_ResourceId(resourceId).stream()
            .filter(w -> matchesDate(w.getRecurrenceType(), w.getDayOfWeek(), w.getDayOfMonth(), date))
            .sorted(Comparator.comparing(ResourceAvailability::getStartTime))
            .toList();
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

    private boolean matchesDate(
            AvailabilityRecurrenceType recurrenceType,
            DayOfWeek dayOfWeek,
            Integer dayOfMonth,
            LocalDate date
    ) {
        if (recurrenceType == null) {
            return dayOfWeek == toDayOfWeek(date);
        }

        return switch (recurrenceType) {
            case DAILY -> true;
            case WEEKLY -> dayOfWeek == toDayOfWeek(date);
            case MONTHLY -> dayOfMonth != null && dayOfMonth == date.getDayOfMonth();
        };
    }

    private void validateRecurringRequest(RecurringBookingCreateRequest req) {
        if (req.endDate().isBefore(req.startDate())) {
            throw new AppException("End date must be on or after start date", HttpStatus.BAD_REQUEST);
        }
        if (!req.endTime().isAfter(req.startTime())) {
            throw new AppException("End time must be after start time", HttpStatus.BAD_REQUEST);
        }
    }

    private Set<java.time.DayOfWeek> parseWeeklyRule(String recurrenceRule) {
        Map<String, String> parts = new HashMap<>();
        for (String token : recurrenceRule.trim().split(";")) {
            String[] keyValue = token.split("=", 2);
            if (keyValue.length != 2) {
                throw new AppException("Invalid recurrence rule format", HttpStatus.BAD_REQUEST);
            }
            parts.put(keyValue[0].trim().toUpperCase(), keyValue[1].trim().toUpperCase());
        }

        String frequency = parts.get("FREQ");
        if (!"WEEKLY".equals(frequency)) {
            throw new AppException("Only weekly recurrence is supported", HttpStatus.BAD_REQUEST);
        }

        Set<String> allowedKeys = Set.of("FREQ", "BYDAY");
        for (String key : parts.keySet()) {
            if (!allowedKeys.contains(key)) {
                throw new AppException("Unsupported recurrence rule parameter: " + key, HttpStatus.BAD_REQUEST);
            }
        }

        String byDay = parts.get("BYDAY");
        if (byDay == null || byDay.isBlank()) {
            return EnumSet.allOf(java.time.DayOfWeek.class);
        }

        Set<java.time.DayOfWeek> result = EnumSet.noneOf(java.time.DayOfWeek.class);
        Set<String> seen = new HashSet<>();
        for (String dayCode : byDay.split(",")) {
            String normalized = dayCode.trim().toUpperCase();
            if (normalized.isBlank()) {
                continue;
            }
            if (!seen.add(normalized)) {
                continue;
            }
            result.add(parseDayCode(normalized));
        }
        if (result.isEmpty()) {
            throw new AppException("BYDAY must contain at least one weekday code", HttpStatus.BAD_REQUEST);
        }
        return result;
    }

    private java.time.DayOfWeek parseDayCode(String code) {
        return switch (code) {
            case "MO" -> java.time.DayOfWeek.MONDAY;
            case "TU" -> java.time.DayOfWeek.TUESDAY;
            case "WE" -> java.time.DayOfWeek.WEDNESDAY;
            case "TH" -> java.time.DayOfWeek.THURSDAY;
            case "FR" -> java.time.DayOfWeek.FRIDAY;
            case "SA" -> java.time.DayOfWeek.SATURDAY;
            case "SU" -> java.time.DayOfWeek.SUNDAY;
            default -> throw new AppException("Unsupported BYDAY code: " + code, HttpStatus.BAD_REQUEST);
        };
    }

    private List<LocalDate> generateOccurrenceDates(
            LocalDate startDate,
            LocalDate endDate,
            Set<java.time.DayOfWeek> allowedDays
    ) {
        List<LocalDate> dates = new java.util.ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (allowedDays.contains(date.getDayOfWeek())) {
                dates.add(date);
            }
        }
        if (dates.isEmpty()) {
            throw new AppException("No recurring occurrences found in the selected date range", HttpStatus.BAD_REQUEST);
        }
        return dates;
    }
}

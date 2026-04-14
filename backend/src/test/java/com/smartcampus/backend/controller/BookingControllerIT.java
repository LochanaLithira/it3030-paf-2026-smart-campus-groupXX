package com.smartcampus.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.booking.BookingCreateRequest;
import com.smartcampus.backend.dto.booking.BookingRejectRequest;
import com.smartcampus.backend.dto.booking.BookingResourceSummary;
import com.smartcampus.backend.dto.booking.BookingResponse;
import com.smartcampus.backend.dto.booking.BookingSuggestion;
import com.smartcampus.backend.dto.booking.BookingUserSummary;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateRequest;
import com.smartcampus.backend.dto.booking.RecurringBookingCreateResponse;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.GlobalExceptionHandler;
import com.smartcampus.backend.model.enums.BookingStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import com.smartcampus.backend.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingControllerIT {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(bookingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createBooking_returnsCreated() throws Exception {
        UUID bookingId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        BookingCreateRequest request = new BookingCreateRequest(
                resourceId,
                null,
                LocalDate.now().plusDays(2),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                "Team Sync",
                12
        );

        BookingResponse response = new BookingResponse(
                bookingId,
                new BookingResourceSummary(resourceId, null, "Hall A", ResourceType.LECTURE_HALL),
                new BookingUserSummary(userId, "Alice", "alice@uni.edu"),
                request.bookingDate(),
                request.startTime(),
                request.endTime(),
                request.purpose(),
                request.expectedAttendees(),
                BookingStatus.PENDING,
                null,
                null,
                null,
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(bookingService.createBooking(any(BookingCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId").value(bookingId.toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createBooking_returnsBadRequestForInvalidPayload() throws Exception {
        String invalidPayload = """
                {
                  "resourceId": null,
                  "bookingDate": null,
                  "startTime": null,
                  "endTime": null,
                  "purpose": "",
                  "expectedAttendees": 0
                }
                """;

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void approveBooking_returnsBadRequestForInvalidTransition() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.approveBooking(eq(bookingId)))
                .thenThrow(new AppException("Only PENDING bookings can be approved", HttpStatus.BAD_REQUEST));

        mockMvc.perform(patch("/bookings/{bookingId}/approve", bookingId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only PENDING bookings can be approved"));
    }

    @Test
    void rejectBooking_returnsBadRequestForInvalidTransition() throws Exception {
        UUID bookingId = UUID.randomUUID();
        BookingRejectRequest request = new BookingRejectRequest("Already occupied");

        when(bookingService.rejectBooking(eq(bookingId), any(BookingRejectRequest.class)))
                .thenThrow(new AppException("Only PENDING bookings can be rejected", HttpStatus.BAD_REQUEST));

        mockMvc.perform(patch("/bookings/{bookingId}/reject", bookingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only PENDING bookings can be rejected"));
    }

    @Test
    void cancelBooking_returnsBadRequestForInvalidTransition() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingService.cancelBooking(eq(bookingId)))
                .thenThrow(new AppException("Only PENDING or APPROVED bookings can be cancelled", HttpStatus.BAD_REQUEST));

        mockMvc.perform(patch("/bookings/{bookingId}/cancel", bookingId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only PENDING or APPROVED bookings can be cancelled"));
    }

    @Test
    void createRecurringBooking_returnsCreated() throws Exception {
        UUID groupId = UUID.randomUUID();
        RecurringBookingCreateRequest request = new RecurringBookingCreateRequest(
                UUID.randomUUID(),
                "FREQ=WEEKLY;BYDAY=MO,WE",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(20),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                "Recurring Seminar",
                30
        );

        when(bookingService.createRecurringBooking(any(RecurringBookingCreateRequest.class)))
                .thenReturn(new RecurringBookingCreateResponse(groupId, 6));

        mockMvc.perform(post("/bookings/recurring")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.groupId").value(groupId.toString()))
                .andExpect(jsonPath("$.bookingsCreated").value(6));
    }

    @Test
    void createRecurringBooking_returnsConflictWithSuggestions() throws Exception {
        RecurringBookingCreateRequest request = new RecurringBookingCreateRequest(
                UUID.randomUUID(),
                "FREQ=WEEKLY;BYDAY=MO",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(15),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                "Recurring Lab",
                20
        );

        List<BookingSuggestion> suggestions = List.of(
                new BookingSuggestion(
                        BookingSuggestion.SuggestionKind.SAME_RESOURCE,
                        request.resourceId(),
                        "Lab A",
                        LocalTime.of(10, 0),
                        LocalTime.of(11, 0)
                )
        );

        when(bookingService.createRecurringBooking(any(RecurringBookingCreateRequest.class)))
                .thenThrow(new BookingConflictException(
                        "This resource is already booked for one or more selected recurring time slots",
                        suggestions
                ));

        mockMvc.perform(post("/bookings/recurring")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This resource is already booked for one or more selected recurring time slots"))
                .andExpect(jsonPath("$.details.suggestions").isArray())
                .andExpect(jsonPath("$.details.suggestions[0].kind").value("SAME_RESOURCE"));
    }

}

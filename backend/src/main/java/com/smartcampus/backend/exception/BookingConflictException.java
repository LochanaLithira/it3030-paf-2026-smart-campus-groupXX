package com.smartcampus.backend.exception;

import com.smartcampus.backend.dto.booking.BookingSuggestion;

import java.util.List;

public class BookingConflictException extends RuntimeException {

    private final List<BookingSuggestion> suggestions;

    public BookingConflictException(String message, List<BookingSuggestion> suggestions) {
        super(message);
        this.suggestions = suggestions;
    }

    public List<BookingSuggestion> getSuggestions() {
        return suggestions;
    }
}


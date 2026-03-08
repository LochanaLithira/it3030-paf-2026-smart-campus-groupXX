package com.smartcampus.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Base application exception. Carries an HTTP status so the global handler can
 * translate it to the correct response code without subclass knowledge.
 */
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public AppException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}

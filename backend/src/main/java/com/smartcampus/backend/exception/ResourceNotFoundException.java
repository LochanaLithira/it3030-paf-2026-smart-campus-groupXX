package com.smartcampus.backend.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String entity, Object id) {
        super(entity + " not found with id: " + id, HttpStatus.NOT_FOUND);
    }
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

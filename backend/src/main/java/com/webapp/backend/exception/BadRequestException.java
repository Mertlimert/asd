package com.webapp.backend.exception;

/**
 * İstek parametreleri geçersiz olduğunda fırlatılır
 */
public class BadRequestException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public BadRequestException(String message) {
        super(message);
    }
}
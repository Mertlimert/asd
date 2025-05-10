package com.webapp.backend.exception;

/**
 * Yetkilendirme ve kimlik doğrulama ile ilgili hatalar için fırlatılır
 */
public class AuthException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public AuthException(String message) {
        super(message);
    }
}
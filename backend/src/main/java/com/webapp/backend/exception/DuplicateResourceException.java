package com.webapp.backend.exception;

/**
 * Zaten var olan bir kaynağı eklemeye çalıştığımızda fırlatılır
 * Örneğin: aynı kullanıcı adı veya e-posta ile kayıt olmak
 */
public class DuplicateResourceException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public DuplicateResourceException(String message) {
        super(message);
    }
    
    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
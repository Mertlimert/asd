package com.webapp.backend.exception;

/**
 * Bir kaynak (kullanıcı, ürün, sepet vs.) bulunamadığında fırlatılır
 */
public class ResourceNotFoundException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
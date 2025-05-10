package com.webapp.backend.exception;

/**
 * Adres işlemleri sırasında ortaya çıkabilecek özel hata durumları için fırlatılır.
 * Örneğin: geçersiz adres bilgileri, adres silme kısıtlamaları vb.
 */
public class AddressException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private String errorCode;

    public AddressException(String message) {
        super(message);
    }
    
    public AddressException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
} 
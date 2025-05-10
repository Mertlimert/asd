package com.webapp.backend.exception;

/**
 * Kupon işlemleri sırasında ortaya çıkabilecek özel hata durumları için fırlatılır.
 * Örneğin: süresi dolmuş kupon, minimum tutar sağlanmayan kupon vb.
 */
public class CouponException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private String errorCode;

    public CouponException(String message) {
        super(message);
    }
    
    public CouponException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
} 
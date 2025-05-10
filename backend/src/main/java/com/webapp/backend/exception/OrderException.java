package com.webapp.backend.exception;

/**
 * Sipariş işlemleri sırasında ortaya çıkabilecek özel hata durumları için fırlatılır.
 * Örneğin: boş sepet durumu, yetersiz stok, geçersiz sipariş durumu vb.
 */
public class OrderException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private String errorCode;

    public OrderException(String message) {
        super(message);
    }
    
    public OrderException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
} 
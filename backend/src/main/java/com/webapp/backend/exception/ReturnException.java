package com.webapp.backend.exception;

/**
 * İade işlemleri sırasında ortaya çıkabilecek özel hata durumları için fırlatılır.
 * Örneğin: iade süresi dışında yapılan talepler, geçersiz iade nedeni vb.
 */
public class ReturnException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private String errorCode;

    public ReturnException(String message) {
        super(message);
    }
    
    public ReturnException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
} 
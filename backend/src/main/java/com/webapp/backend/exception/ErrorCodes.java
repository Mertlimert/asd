package com.webapp.backend.exception;

/**
 * Uygulama genelinde kullanılacak hata kodlarını tanımlar.
 * Bu kodlar, frontend'e hangi özel hata tipinin oluştuğunu bildirmek için kullanılır.
 */
public class ErrorCodes {
    
    // Genel hata kodları
    public static final String VALIDATION_ERROR = "ERR_VALIDATION";
    public static final String UNAUTHORIZED = "ERR_UNAUTHORIZED";
    public static final String RESOURCE_NOT_FOUND = "ERR_RESOURCE_NOT_FOUND";
    public static final String DUPLICATE_RESOURCE = "ERR_DUPLICATE_RESOURCE";
    
    // Sipariş hata kodları
    public static final String ORDER_EMPTY_CART = "ERR_ORDER_EMPTY_CART";
    public static final String ORDER_INSUFFICIENT_STOCK = "ERR_ORDER_INSUFFICIENT_STOCK";
    public static final String ORDER_INVALID_STATUS = "ERR_ORDER_INVALID_STATUS";
    public static final String ORDER_PAYMENT_FAILED = "ERR_ORDER_PAYMENT_FAILED";
    public static final String ORDER_CANCEL_LIMIT = "ERR_ORDER_CANCEL_LIMIT";
    
    // Adres hata kodları
    public static final String ADDRESS_INVALID = "ERR_ADDRESS_INVALID";
    public static final String ADDRESS_DELETE_CONSTRAINT = "ERR_ADDRESS_DELETE_CONSTRAINT";
    
    // İade hata kodları
    public static final String RETURN_PERIOD_EXPIRED = "ERR_RETURN_PERIOD_EXPIRED";
    public static final String RETURN_INVALID_REASON = "ERR_RETURN_INVALID_REASON";
    public static final String RETURN_ALREADY_PROCESSED = "ERR_RETURN_ALREADY_PROCESSED";
    public static final String RETURN_INVALID_QUANTITY = "ERR_RETURN_INVALID_QUANTITY";
    
    // Kupon hata kodları
    public static final String COUPON_EXPIRED = "ERR_COUPON_EXPIRED";
    public static final String COUPON_INVALID = "ERR_COUPON_INVALID";
    public static final String COUPON_MIN_AMOUNT_NOT_MET = "ERR_COUPON_MIN_AMOUNT_NOT_MET";
    public static final String COUPON_ALREADY_USED = "ERR_COUPON_ALREADY_USED";
    public static final String COUPON_DUPLICATE_CODE = "ERR_COUPON_DUPLICATE_CODE";
    
    private ErrorCodes() {
        // Utility sınıfı olduğu için constructor private
    }
} 
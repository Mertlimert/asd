package com.webapp.backend.dto;

import lombok.Data;

@Data
public class PaymentMethodDto {
    private String cardNumber;
    private int expiryMonth;
    private int expiryYear;
    private String cvc;
    private String cardHolderName;
    private boolean makeDefault;
    
    // Getters and Setters
    public String getCardNumber() {
        return cardNumber;
    }
    
    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }
    
    public int getExpiryMonth() {
        return expiryMonth;
    }
    
    public void setExpiryMonth(int expiryMonth) {
        this.expiryMonth = expiryMonth;
    }
    
    public int getExpiryYear() {
        return expiryYear;
    }
    
    public void setExpiryYear(int expiryYear) {
        this.expiryYear = expiryYear;
    }
    
    public String getCvc() {
        return cvc;
    }
    
    public void setCvc(String cvc) {
        this.cvc = cvc;
    }
    
    public String getCardHolderName() {
        return cardHolderName;
    }
    
    public void setCardHolderName(String cardHolderName) {
        this.cardHolderName = cardHolderName;
    }
    
    public boolean isMakeDefault() {
        return makeDefault;
    }
    
    public void setMakeDefault(boolean makeDefault) {
        this.makeDefault = makeDefault;
    }
    
    // Ödeme yöntemi ekleme isteği
    @Data
    public static class Request {
        private String cardNumber;
        private String cardHolderName;
        private Integer expiryMonth;
        private Integer expiryYear;
        private String cvc;
        private Boolean makeDefault;
        private Long billingAddressId; // İsteğe bağlı fatura adresi
    }
    
    // Ödeme yöntemi cevabı
    @Data
    public static class Response {
        private Long id;
        private String cardBrand;      // Visa, Mastercard vb.
        private String cardLastFour;   // Kartın son 4 hanesi
        private Integer expiryMonth;
        private Integer expiryYear;
        private Boolean isDefault;
        private AddressDto billingAddress;  // İsteğe bağlı fatura adresi
    }
} 
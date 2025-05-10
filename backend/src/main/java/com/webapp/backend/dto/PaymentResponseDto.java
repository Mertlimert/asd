package com.webapp.backend.dto;

import lombok.Data;

@Data
public class PaymentResponseDto {
    private String sessionUrl;
    private String paymentStatus;
    private String receiptUrl;
    
    // Getters and Setters
    public String getSessionUrl() {
        return sessionUrl;
    }
    
    public void setSessionUrl(String sessionUrl) {
        this.sessionUrl = sessionUrl;
    }
    
    public String getPaymentStatus() {
        return paymentStatus;
    }
    
    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    
    public String getReceiptUrl() {
        return receiptUrl;
    }
    
    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }
} 
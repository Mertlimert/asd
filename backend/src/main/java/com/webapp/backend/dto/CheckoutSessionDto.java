package com.webapp.backend.dto;

import lombok.Data;

@Data
public class CheckoutSessionDto {
    private String successUrl;
    private String cancelUrl;
    
    // Getters and Setters
    public String getSuccessUrl() {
        return successUrl;
    }
    
    public void setSuccessUrl(String successUrl) {
        this.successUrl = successUrl;
    }
    
    public String getCancelUrl() {
        return cancelUrl;
    }
    
    public void setCancelUrl(String cancelUrl) {
        this.cancelUrl = cancelUrl;
    }
} 
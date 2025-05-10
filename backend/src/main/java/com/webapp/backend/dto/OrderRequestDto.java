package com.webapp.backend.dto;

import lombok.Data;

@Data
public class OrderRequestDto {
    private Long shippingAddressId; // Teslimat adresi ID'si
    private Long billingAddressId;  // Fatura adresi ID'si (null ise shipping address kullanılır)
    private String paymentMethod;   // Ödeme yöntemi (stripe, kapıda ödeme vb.)
    private String couponCode;      // Kupon kodu (opsiyonel)
    private Long paymentMethodId;   // Kaydedilmiş ödeme yöntemi ID'si (Stripe için)
    
    // Getter and Setter metodları Lombok tarafından otomatik olarak oluşturulacak
} 
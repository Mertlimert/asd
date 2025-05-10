package com.webapp.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.PaymentStatus;

import lombok.Data;

@Data
public class OrderResponseDto {
    private Long id;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private AddressDto shippingAddress;
    private String trackingNumber;
    private List<OrderItemDto> items;
    private Boolean hasCoupon;
    
    // Kullanıcı bilgileri
    private Long userId;
    private String userFirstName;
    private String userLastName;
    
    // İç içe adres DTO sınıfı
    @Data
    public static class AddressDto {
        private Long id;
        private String recipientName;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String postalCode;
        private String country;
        private String phoneNumber;
    }
    
    // İç içe sipariş öğesi DTO sınıfı
    @Data
    public static class OrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
        private Long sellerId;
        private String status; // Ürün durumu
    }
} 
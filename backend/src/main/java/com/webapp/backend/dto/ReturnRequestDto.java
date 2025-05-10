package com.webapp.backend.dto;

import java.util.List;

import com.webapp.backend.model.ReturnCondition;
import com.webapp.backend.model.ReturnReason;

import lombok.Data;

@Data
public class ReturnRequestDto {
    private Long orderId;                  // İade edilecek siparişin ID'si
    private String reasonForReturn;        // Genel iade nedeni
    
    private List<ReturnItemRequest> items; // İade edilecek ürünler
    
    @Data
    public static class ReturnItemRequest {
        private Long orderItemId;          // Sipariş öğesi ID'si
        private Integer quantity;          // İade edilecek miktar
        private ReturnReason returnReason; // İade nedeni
        private ReturnCondition returnCondition; // Ürün durumu
        private String additionalComments; // Ek açıklamalar
    }
} 
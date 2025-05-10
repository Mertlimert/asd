package com.webapp.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sepet içeriğini görüntüleme için kullanılan DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDto {
    private Long id;
    private Long userId;
    private List<CartItemDto> items = new ArrayList<>();
    private Double totalPrice;
    private LocalDateTime updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDto {
        private Long id;
        private ProductSummaryDto product;
        private Integer quantity;
        private Double subtotal; // quantity * product.price
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummaryDto {
        private Long id;
        private String name;
        private Double price;
        private String image_url;
    }
}
package com.webapp.backend.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ürün bilgilerini görüntüleme için kullanılan DTO 
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDto {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String image_url;
    private Integer stock_quantity;
    private CategoryDto category;
    private SellerDto seller;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDto {
        private Long id;
        private String name;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerDto {
        private Long id;
        private String username;
    }
}
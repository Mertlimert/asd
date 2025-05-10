package com.webapp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ürün oluşturma ve güncelleme işlemleri için kullanılan DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDto {
    
    @NotBlank(message = "Ürün adı boş olamaz")
    private String name;
    
    private String description;
    
    @NotNull(message = "Ürün fiyatı belirtilmelidir")
    @Min(value = 0, message = "Fiyat 0'dan küçük olamaz")
    private Double price;
    
    private String image_url;
    
    @NotNull(message = "Stok miktarı belirtilmelidir")
    @Min(value = 0, message = "Stok miktarı negatif olamaz")
    private Integer stock_quantity;
    
    @NotNull(message = "Kategori ID belirtilmelidir")
    private Long category_id;
    
    @NotNull(message = "Satıcı ID belirtilmelidir")
    private Long seller_id;
}
package com.webapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDto {
    private Long id;
    
    @NotNull(message = "Product ID cannot be null")
    private Long productId;
    
    @NotNull(message = "User ID cannot be null")
    private Long userId;
    
    @NotNull(message = "Rating cannot be null")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot be more than 5")
    private Integer rating;
    
    @NotBlank(message = "Comment cannot be empty")
    private String comment;
} 
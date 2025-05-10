package com.webapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDto {
    private Long id;
    private Long productId;
    private Long userId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private UserInfo user;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String firstName;
        private String lastName;
    }
} 
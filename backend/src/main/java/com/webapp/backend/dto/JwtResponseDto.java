package com.webapp.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JWT kimlik doğrulama yanıtı için veri transfer nesnesi
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponseDto {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    
    public JwtResponseDto(String token, Long id, String username, String email, 
                        String role, String firstName, String lastName) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
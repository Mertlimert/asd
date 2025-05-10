package com.webapp.backend.dto;

import com.webapp.backend.model.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kullanıcı profil bilgileri için kullanılan DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private Boolean banned;
}
package com.webapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Kullanıcı kayıt isteği için veri transfer nesnesi
 */
@Data
public class RegisterDto {
    
    @NotBlank(message = "Kullanıcı adı boş olamaz")
    @Size(min = 3, max = 20, message = "Kullanıcı adı 3-20 karakter arasında olmalıdır")
    private String username;
    
    @NotBlank(message = "Email adresi boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;
    
    @Size(min = 6, max = 40, message = "Şifre 6-40 karakter arasında olmalıdır")
    private String password;
    
    private String firstName;
    
    private String lastName;
    private String role;
    private Boolean banned;
}
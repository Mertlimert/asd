package com.webapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Kullanıcı giriş isteği için veri transfer nesnesi
 */
@Data
public class LoginDto {
    
    @NotBlank(message = "Email adresi boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;
    
    @NotBlank(message = "Şifre boş olamaz")
    private String password;
    
    // Lombok @Data kullandığımız için getter/setter'ları otomatik oluşturulacak
}
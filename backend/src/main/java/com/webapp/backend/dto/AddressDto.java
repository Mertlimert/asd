package com.webapp.backend.dto;

import lombok.Data;

@Data
public class AddressDto {
    private Long id;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String phoneNumber;
    private String addressName;     // Adres için tanımlayıcı (örn. "Ev", "İş" vb.)
    private String recipientName;   // Alıcı ismi
    private Boolean isDefault;      // Varsayılan adres mi
} 
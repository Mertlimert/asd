package com.webapp.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CouponDto {
    // Kupon oluşturma veya güncelleme isteği
    @Data
    public static class Request {
        private String code;              // Kupon kodu
        private BigDecimal discountAmount; // Sabit indirim tutarı (null ise yüzde indirim kullanılır)
        private Integer discountPercent;   // Yüzde indirim oranı (null ise sabit tutar kullanılır)
        private BigDecimal minPurchaseAmount; // Minimum sepet tutarı
        private LocalDateTime validFrom;   // Geçerlilik başlangıç tarihi
        private LocalDateTime validTo;     // Geçerlilik bitiş tarihi
        private Boolean isActive;          // Kupon aktif mi
    }
    
    // Kupon bilgisi cevabı
    @Data
    public static class Response {
        private Long id;
        private String code;
        private String discountText;      // "50 TL indirim" veya "%15 indirim" gibi
        private BigDecimal minPurchaseAmount;
        private LocalDateTime validFrom;
        private LocalDateTime validTo;
        private Boolean isActive;
        private Boolean isValid;          // Şu anda geçerli mi
    }
    
    // Kupon uygulama isteği
    @Data
    public static class ApplyRequest {
        private String code;              // Uygulanacak kupon kodu
        private BigDecimal cartTotal;     // Sepet toplam tutarı
    }
    
    // Kupon uygulama cevabı
    @Data
    public static class ApplyResponse {
        private Boolean valid;            // Kupon geçerli mi
        private String message;           // Başarı veya hata mesajı
        private BigDecimal discountAmount; // İndirim tutarı
        private BigDecimal newTotal;      // İndirim sonrası yeni tutar
    }
} 
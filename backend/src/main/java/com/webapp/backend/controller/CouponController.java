package com.webapp.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.CouponDto;
import com.webapp.backend.exception.CouponException;
import com.webapp.backend.exception.ErrorCodes;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.Coupon;
import com.webapp.backend.service.CouponService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponService couponService;
    
    /**
     * Tüm kuponları getirme endpoint'i (Admin)
     */
    @GetMapping
    public ResponseEntity<List<CouponDto.Response>> getAllCoupons() {
        List<Coupon> coupons = couponService.getAllCoupons();
        
        List<CouponDto.Response> couponDtos = coupons.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(couponDtos);
    }
    
    /**
     * Aktif kuponları getirme endpoint'i
     */
    @GetMapping("/active")
    public ResponseEntity<List<CouponDto.Response>> getActiveCoupons() {
        List<Coupon> activeCoupons = couponService.getActiveCoupons();
        
        List<CouponDto.Response> couponDtos = activeCoupons.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(couponDtos);
    }
    
    /**
     * Geçerli kuponları getirme endpoint'i
     */
    @GetMapping("/valid")
    public ResponseEntity<List<CouponDto.Response>> getValidCoupons() {
        List<Coupon> validCoupons = couponService.getValidCoupons();
        
        List<CouponDto.Response> couponDtos = validCoupons.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(couponDtos);
    }
    
    /**
     * Belirli bir kuponu getirme endpoint'i
     */
    @GetMapping("/{id}")
    public ResponseEntity<CouponDto.Response> getCouponById(@PathVariable Long id) {
        Optional<Coupon> couponOpt = couponService.getCouponById(id);
        
        if (!couponOpt.isPresent()) {
            throw new ResourceNotFoundException("Coupon", "id", id);
        }
        
        CouponDto.Response couponDto = convertToResponseDto(couponOpt.get());
        return ResponseEntity.ok(couponDto);
    }
    
    /**
     * Kupon kodu ile kupon getirme endpoint'i
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<CouponDto.Response> getCouponByCode(@PathVariable String code) {
        Coupon coupon = couponService.getCouponByCode(code);
        
        if (coupon == null) {
            throw new CouponException("'" + code + "' kupon kodu bulunamadı", ErrorCodes.COUPON_INVALID);
        }
        
        CouponDto.Response couponDto = convertToResponseDto(coupon);
        return ResponseEntity.ok(couponDto);
    }
    
    /**
     * Yeni kupon oluşturma endpoint'i (Admin)
     */
    @PostMapping
    public ResponseEntity<CouponDto.Response> createCoupon(@RequestBody CouponDto.Request couponRequest) {
        try {
            // Kupon verilerini doğrula
            validateCouponData(couponRequest);
            
            Coupon coupon = convertToEntity(couponRequest);
            Coupon createdCoupon = couponService.createCoupon(coupon);
            
            CouponDto.Response responseDto = convertToResponseDto(createdCoupon);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalArgumentException e) {
            // Kupon servisi tarafından fırlatılan hatalar
            if (e.getMessage().contains("Bu kupon kodu zaten kullanılıyor")) {
                throw new CouponException(e.getMessage(), ErrorCodes.COUPON_DUPLICATE_CODE);
            } else {
                throw new CouponException(e.getMessage(), ErrorCodes.COUPON_INVALID);
            }
        }
    }
    
    /**
     * Kupon güncelleme endpoint'i (Admin)
     */
    @PutMapping("/{id}")
    public ResponseEntity<CouponDto.Response> updateCoupon(
            @PathVariable Long id,
            @RequestBody CouponDto.Request couponRequest) {
        
        Optional<Coupon> couponOpt = couponService.getCouponById(id);
        
        if (!couponOpt.isPresent()) {
            throw new ResourceNotFoundException("Coupon", "id", id);
        }
        
        try {
            // Kupon verilerini doğrula
            validateCouponData(couponRequest);
            
            Coupon existingCoupon = couponOpt.get();
            Coupon updatedCoupon = convertToEntity(couponRequest);
            
            Coupon savedCoupon = couponService.updateCoupon(existingCoupon, updatedCoupon);
            
            CouponDto.Response responseDto = convertToResponseDto(savedCoupon);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            // Kupon servisi tarafından fırlatılan hatalar
            if (e.getMessage().contains("Bu kupon kodu zaten kullanılıyor")) {
                throw new CouponException(e.getMessage(), ErrorCodes.COUPON_DUPLICATE_CODE);
            } else {
                throw new CouponException(e.getMessage(), ErrorCodes.COUPON_INVALID);
            }
        }
    }
    
    /**
     * Kupon silme endpoint'i (Admin)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        Optional<Coupon> couponOpt = couponService.getCouponById(id);
        
        if (!couponOpt.isPresent()) {
            throw new ResourceNotFoundException("Coupon", "id", id);
        }
        
        try {
            couponService.deleteCoupon(couponOpt.get());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Kupon kullanıldıysa veya başka bir kısıtlama varsa
            throw new CouponException(
                "Bu kupon siparişlerde kullanıldığı için silinemiyor.", 
                ErrorCodes.COUPON_ALREADY_USED
            );
        }
    }
    
    /**
     * Kupon aktifleştirme endpoint'i (Admin)
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<CouponDto.Response> activateCoupon(@PathVariable Long id) {
        Optional<Coupon> couponOpt = couponService.getCouponById(id);
        
        if (!couponOpt.isPresent()) {
            throw new ResourceNotFoundException("Coupon", "id", id);
        }
        
        Coupon coupon = couponOpt.get();
        
        // Süresi dolmuş kuponlar aktifleştirilemez
        if (coupon.getValidTo() != null && coupon.getValidTo().isBefore(LocalDateTime.now())) {
            throw new CouponException(
                "Süresi dolmuş kupon aktifleştirilemez", 
                ErrorCodes.COUPON_EXPIRED
            );
        }
        
        Coupon activatedCoupon = couponService.activateCoupon(coupon);
        
        CouponDto.Response responseDto = convertToResponseDto(activatedCoupon);
        return ResponseEntity.ok(responseDto);
    }
    
    /**
     * Kupon deaktifleştirme endpoint'i (Admin)
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<CouponDto.Response> deactivateCoupon(@PathVariable Long id) {
        Optional<Coupon> couponOpt = couponService.getCouponById(id);
        
        if (!couponOpt.isPresent()) {
            throw new ResourceNotFoundException("Coupon", "id", id);
        }
        
        Coupon deactivatedCoupon = couponService.deactivateCoupon(couponOpt.get());
        
        CouponDto.Response responseDto = convertToResponseDto(deactivatedCoupon);
        return ResponseEntity.ok(responseDto);
    }
    
    /**
     * Kupon uygulama endpoint'i
     */
    @PostMapping("/apply")
    public ResponseEntity<CouponDto.ApplyResponse> applyCoupon(@RequestBody CouponDto.ApplyRequest applyRequest) {
        String code = applyRequest.getCode();
        
        // Kupon kodu yoksa hata döndür
        if (code == null || code.trim().isEmpty()) {
            throw new CouponException("Kupon kodu boş olamaz", ErrorCodes.COUPON_INVALID);
        }
        
        // Kupon doğruluğunu kontrol et
        if (!couponService.isValidCoupon(code, applyRequest.getCartTotal())) {
            Coupon coupon = couponService.getCouponByCode(code);
            
            // Kupon bulunamadı
            if (coupon == null) {
                throw new CouponException("Geçersiz kupon kodu", ErrorCodes.COUPON_INVALID);
            }
            
            // Kupon pasif
            if (!coupon.getIsActive()) {
                throw new CouponException("Bu kupon aktif değil", ErrorCodes.COUPON_INVALID);
            }
            
            // Kupon süresi dolmuş
            if (coupon.getValidTo() != null && coupon.getValidTo().isBefore(LocalDateTime.now())) {
                throw new CouponException("Bu kuponun süresi dolmuş", ErrorCodes.COUPON_EXPIRED);
            }
            
            // Minimum sepet tutarı sağlanmıyor
            if (coupon.getMinPurchaseAmount() != null && 
                applyRequest.getCartTotal().compareTo(coupon.getMinPurchaseAmount()) < 0) {
                throw new CouponException(
                    "Bu kupon için minimum sepet tutarı: " + coupon.getMinPurchaseAmount() + " TL", 
                    ErrorCodes.COUPON_MIN_AMOUNT_NOT_MET
                );
            }
            
            // Diğer hatalar
            throw new CouponException("Kupon bu sepet için geçerli değil", ErrorCodes.COUPON_INVALID);
        }
        
        // İndirim tutarını hesapla
        java.math.BigDecimal discountAmount = couponService.calculateDiscount(code, applyRequest.getCartTotal());
        java.math.BigDecimal newTotal = applyRequest.getCartTotal().subtract(discountAmount);
        
        CouponDto.ApplyResponse response = new CouponDto.ApplyResponse();
        response.setValid(true);
        response.setMessage("Kupon başarıyla uygulandı.");
        response.setDiscountAmount(discountAmount);
        response.setNewTotal(newTotal);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Coupon entity'sini CouponDto.Response'a dönüştürür
     */
    private CouponDto.Response convertToResponseDto(Coupon coupon) {
        CouponDto.Response dto = new CouponDto.Response();
        dto.setId(coupon.getId());
        dto.setCode(coupon.getCode());
        
        // İndirim metni formatı
        String discountText;
        if (coupon.getDiscountAmount() != null) {
            discountText = coupon.getDiscountAmount() + " TL indirim";
        } else {
            discountText = "%" + coupon.getDiscountPercent() + " indirim";
        }
        dto.setDiscountText(discountText);
        
        dto.setMinPurchaseAmount(coupon.getMinPurchaseAmount());
        dto.setValidFrom(coupon.getValidFrom());
        dto.setValidTo(coupon.getValidTo());
        dto.setIsActive(coupon.getIsActive());
        
        // Şu anda geçerli mi kontrolü
        LocalDateTime now = LocalDateTime.now();
        boolean isCurrentlyValid = coupon.getIsActive() && 
                (coupon.getValidFrom() == null || now.isAfter(coupon.getValidFrom())) &&
                (coupon.getValidTo() == null || now.isBefore(coupon.getValidTo()));
        dto.setIsValid(isCurrentlyValid);
        
        return dto;
    }
    
    /**
     * CouponDto.Request'i Coupon entity'sine dönüştürür
     */
    private Coupon convertToEntity(CouponDto.Request dto) {
        Coupon coupon = new Coupon();
        coupon.setCode(dto.getCode());
        coupon.setDiscountAmount(dto.getDiscountAmount());
        coupon.setDiscountPercent(dto.getDiscountPercent());
        coupon.setMinPurchaseAmount(dto.getMinPurchaseAmount());
        coupon.setValidFrom(dto.getValidFrom());
        coupon.setValidTo(dto.getValidTo());
        coupon.setIsActive(dto.getIsActive());
        return coupon;
    }
    
    /**
     * Kupon verilerinin geçerliliğini kontrol eder
     */
    private void validateCouponData(CouponDto.Request couponRequest) {
        if (couponRequest.getCode() == null || couponRequest.getCode().trim().isEmpty()) {
            throw new CouponException("Kupon kodu boş olamaz", ErrorCodes.COUPON_INVALID);
        }
        
        if (couponRequest.getDiscountAmount() == null && couponRequest.getDiscountPercent() == null) {
            throw new CouponException(
                "İndirim tutarı veya yüzdesi belirtilmelidir", 
                ErrorCodes.COUPON_INVALID
            );
        }
        
        if (couponRequest.getDiscountAmount() != null && couponRequest.getDiscountPercent() != null) {
            throw new CouponException(
                "Bir kupon ya miktar indirimi ya da yüzde indirimi içerebilir, ikisi birden değil", 
                ErrorCodes.COUPON_INVALID
            );
        }
        
        if (couponRequest.getDiscountPercent() != null && 
            (couponRequest.getDiscountPercent() <= 0 || couponRequest.getDiscountPercent() > 100)) {
            throw new CouponException(
                "İndirim yüzdesi 0-100 arasında olmalıdır", 
                ErrorCodes.COUPON_INVALID
            );
        }
        
        if (couponRequest.getDiscountAmount() != null && couponRequest.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new CouponException(
                "İndirim tutarı sıfırdan büyük olmalıdır", 
                ErrorCodes.COUPON_INVALID
            );
        }
        
        if (couponRequest.getValidFrom() != null && couponRequest.getValidTo() != null && 
            couponRequest.getValidFrom().isAfter(couponRequest.getValidTo())) {
            throw new CouponException(
                "Başlangıç tarihi bitiş tarihinden sonra olamaz", 
                ErrorCodes.COUPON_INVALID
            );
        }
    }
} 
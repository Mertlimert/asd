package com.webapp.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.backend.model.Coupon;
import com.webapp.backend.repository.CouponRepository;

@Service
public class CouponService {
    
    @Autowired
    private CouponRepository couponRepository;
    
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }
    
    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByIsActiveTrue();
    }
    
    public List<Coupon> getValidCoupons() {
        return couponRepository.findAllValidCoupons(LocalDateTime.now());
    }
    
    public Optional<Coupon> getCouponById(Long id) {
        return couponRepository.findById(id);
    }
    
    public Coupon getCouponByCode(String code) {
        return couponRepository.findByCode(code);
    }
    
    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        // Kupon kodu kontrolü
        if (couponRepository.findByCode(coupon.getCode()) != null) {
            throw new IllegalArgumentException("Bu kupon kodu zaten kullanılıyor");
        }
        
        // Hem miktar hem yüzde indiriminin aynı anda olmaması gerekiyor
        if (coupon.getDiscountAmount() != null && coupon.getDiscountPercent() != null) {
            throw new IllegalArgumentException("Bir kupon ya miktar indirimi ya da yüzde indirimi içerebilir, ikisi birden değil");
        }
        
        return couponRepository.save(coupon);
    }
    
    @Transactional
    public Coupon updateCoupon(Coupon existingCoupon, Coupon updatedCoupon) {
        // Kupon kodu değiştiyse ve yeni kod zaten kullanımdaysa hata ver
        if (!existingCoupon.getCode().equals(updatedCoupon.getCode()) && 
                couponRepository.findByCode(updatedCoupon.getCode()) != null) {
            throw new IllegalArgumentException("Bu kupon kodu zaten kullanılıyor");
        }
        
        // Hem miktar hem yüzde indiriminin aynı anda olmaması gerekiyor
        if (updatedCoupon.getDiscountAmount() != null && updatedCoupon.getDiscountPercent() != null) {
            throw new IllegalArgumentException("Bir kupon ya miktar indirimi ya da yüzde indirimi içerebilir, ikisi birden değil");
        }
        
        existingCoupon.setCode(updatedCoupon.getCode());
        existingCoupon.setDiscountAmount(updatedCoupon.getDiscountAmount());
        existingCoupon.setDiscountPercent(updatedCoupon.getDiscountPercent());
        existingCoupon.setMinPurchaseAmount(updatedCoupon.getMinPurchaseAmount());
        existingCoupon.setValidFrom(updatedCoupon.getValidFrom());
        existingCoupon.setValidTo(updatedCoupon.getValidTo());
        existingCoupon.setIsActive(updatedCoupon.getIsActive());
        
        return couponRepository.save(existingCoupon);
    }
    
    @Transactional
    public void deleteCoupon(Coupon coupon) {
        couponRepository.delete(coupon);
    }
    
    @Transactional
    public Coupon activateCoupon(Coupon coupon) {
        coupon.setIsActive(true);
        return couponRepository.save(coupon);
    }
    
    @Transactional
    public Coupon deactivateCoupon(Coupon coupon) {
        coupon.setIsActive(false);
        return couponRepository.save(coupon);
    }
    
    public boolean isValidCoupon(String code, BigDecimal purchaseAmount) {
        Coupon coupon = couponRepository.findByCode(code);
        
        if (coupon == null) {
            return false;
        }
        
        return coupon.isValid(LocalDateTime.now(), purchaseAmount);
    }
    
    public BigDecimal calculateDiscount(String code, BigDecimal purchaseAmount) {
        Coupon coupon = couponRepository.findByCode(code);
        
        if (coupon == null || !coupon.isValid(LocalDateTime.now(), purchaseAmount)) {
            return BigDecimal.ZERO;
        }
        
        return coupon.calculateDiscount(purchaseAmount);
    }
} 
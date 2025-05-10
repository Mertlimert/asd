package com.webapp.backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "coupons")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String code;
    
    private BigDecimal discountAmount;
    private Integer discountPercent;
    private BigDecimal minPurchaseAmount;
    
    @Column(nullable = false)
    private LocalDateTime validFrom;
    
    @Column(nullable = false)
    private LocalDateTime validTo;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public Integer getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(Integer discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getMinPurchaseAmount() {
        return minPurchaseAmount;
    }

    public void setMinPurchaseAmount(BigDecimal minPurchaseAmount) {
        this.minPurchaseAmount = minPurchaseAmount;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDateTime getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDateTime validTo) {
        this.validTo = validTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    // Kuponun geçerli olup olmadığını kontrol etme
    public boolean isValid(LocalDateTime now, BigDecimal purchaseAmount) {
        if (!isActive) {
            return false;
        }
        
        if (now.isBefore(validFrom) || now.isAfter(validTo)) {
            return false;
        }
        
        if (minPurchaseAmount != null && purchaseAmount.compareTo(minPurchaseAmount) < 0) {
            return false;
        }
        
        return true;
    }
    
    // İndirim miktarını hesaplama
    public BigDecimal calculateDiscount(BigDecimal totalAmount) {
        if (discountAmount != null) {
            return discountAmount.min(totalAmount); // İndirim tutarı toplam tutardan fazla olamaz
        } else if (discountPercent != null) {
            return totalAmount.multiply(BigDecimal.valueOf(discountPercent).divide(BigDecimal.valueOf(100)));
        }
        return BigDecimal.ZERO;
    }
} 
package com.webapp.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Coupon;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Coupon findByCode(String code);
    
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND c.validFrom <= ?1 AND c.validTo >= ?1")
    List<Coupon> findAllValidCoupons(LocalDateTime now);
    
    List<Coupon> findByIsActiveTrue();
} 
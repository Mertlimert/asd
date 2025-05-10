package com.webapp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.StripePayment;
import com.webapp.backend.model.PaymentStatus;

import java.util.List;

@Repository
public interface StripePaymentRepository extends JpaRepository<StripePayment, Long> {
    StripePayment findByOrder(Order order);
    StripePayment findByStripePaymentId(String stripePaymentId);
    StripePayment findByPaymentIntentId(String paymentIntentId);
    List<StripePayment> findByStatus(PaymentStatus status);
} 
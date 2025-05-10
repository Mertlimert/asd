package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.StripePaymentMethod;
import com.webapp.backend.model.User;

@Repository
public interface StripePaymentMethodRepository extends JpaRepository<StripePaymentMethod, Long> {
    List<StripePaymentMethod> findByUser(User user);
    StripePaymentMethod findByStripePaymentMethodId(String stripePaymentMethodId);
    StripePaymentMethod findByUserAndIsDefaultTrue(User user);
} 
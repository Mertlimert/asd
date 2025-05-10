package com.webapp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.StripeCustomer;
import com.webapp.backend.model.User;

@Repository
public interface StripeCustomerRepository extends JpaRepository<StripeCustomer, Long> {
    StripeCustomer findByUser(User user);
    StripeCustomer findByStripeCustomerId(String stripeCustomerId);
} 
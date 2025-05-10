package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
    List<Order> findByUserOrderByOrderDateDesc(User user);
    List<Order> findByStatus(OrderStatus status);
    Order findByIdAndUser(Long id, User user);
} 
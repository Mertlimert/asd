package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.Return;
import com.webapp.backend.model.ReturnStatus;
import com.webapp.backend.model.User;

@Repository
public interface ReturnRepository extends JpaRepository<Return, Long> {
    List<Return> findByUser(User user);
    List<Return> findByOrder(Order order);
    List<Return> findByStatus(ReturnStatus status);
    Return findByOrderAndId(Order order, Long id);
} 
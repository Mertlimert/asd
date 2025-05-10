package com.webapp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.Shipment;
import com.webapp.backend.model.ShipmentStatus;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Shipment findByOrder(Order order);
    List<Shipment> findByStatus(ShipmentStatus status);
    List<Shipment> findByOrderIn(List<Order> orders);
} 
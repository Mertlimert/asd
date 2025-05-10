package com.webapp.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.Shipment;
import com.webapp.backend.model.ShipmentStatus;
import com.webapp.backend.model.ShipmentUpdate;
import com.webapp.backend.repository.ShipmentRepository;

@Service
public class ShipmentService {
    
    @Autowired
    private ShipmentRepository shipmentRepository;
    
    @Autowired
    private OrderService orderService;
    
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }
    
    public Optional<Shipment> getShipmentById(Long id) {
        return shipmentRepository.findById(id);
    }
    
    public Shipment getShipmentByOrder(Order order) {
        return shipmentRepository.findByOrder(order);
    }
    
    public List<Shipment> getShipmentsByStatus(ShipmentStatus status) {
        return shipmentRepository.findByStatus(status);
    }
    
    @Transactional
    public Shipment createShipment(Order order, String carrier, BigDecimal shippingCost, LocalDate estimatedDeliveryDate) {
        // Siparişin durumunu kontrol et
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("İptal edilmiş sipariş için kargo oluşturulamaz");
        }
        
        // Daha önce kargo oluşturulmuş mu kontrol et
        Shipment existingShipment = shipmentRepository.findByOrder(order);
        if (existingShipment != null) {
            throw new IllegalStateException("Bu siparişe ait kargo zaten mevcut");
        }
        
        // Yeni kargo oluştur
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setCarrier(carrier);
        shipment.setStatus(ShipmentStatus.PREPARING);
        shipment.setShippingCost(shippingCost);
        shipment.setEstimatedDeliveryDate(estimatedDeliveryDate);
        shipment.setCreatedAt(LocalDateTime.now());
        shipment.setUpdatedAt(LocalDateTime.now());
        
        // Siparişin durumunu güncelle
        orderService.updateOrderStatus(order, OrderStatus.PROCESSING);
        
        return shipmentRepository.save(shipment);
    }
    
    @Transactional
    public Shipment updateShipmentStatus(Shipment shipment, ShipmentStatus newStatus, String location, String description) {
        shipment.setStatus(newStatus);
        shipment.setUpdatedAt(LocalDateTime.now());
        
        // Kargo güncellemesi ekle
        ShipmentUpdate update = new ShipmentUpdate();
        update.setShipment(shipment);
        update.setStatus(newStatus.toString());
        update.setLocation(location);
        update.setDescription(description);
        update.setUpdateTime(LocalDateTime.now());
        
        shipment.addUpdate(update);
        
        // Eğer kargo teslim edildiyse, siparişin durumunu güncelle ve teslim tarihini ayarla
        if (newStatus == ShipmentStatus.DELIVERED) {
            orderService.updateOrderStatus(shipment.getOrder(), OrderStatus.DELIVERED);
            shipment.setActualDeliveryDate(LocalDate.now());
        }
        
        return shipmentRepository.save(shipment);
    }
    
    @Transactional
    public Shipment addTrackingNumber(Shipment shipment, String trackingNumber) {
        shipment.setTrackingNumber(trackingNumber);
        shipment.setUpdatedAt(LocalDateTime.now());
        
        // Kargo güncellemesi ekle
        ShipmentUpdate update = new ShipmentUpdate();
        update.setShipment(shipment);
        update.setStatus(shipment.getStatus().toString());
        update.setDescription("Kargo takip numarası eklendi: " + trackingNumber);
        update.setUpdateTime(LocalDateTime.now());
        
        shipment.addUpdate(update);
        
        return shipmentRepository.save(shipment);
    }
} 
package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);
    List<OrderItem> findByProduct(Product product);
    List<OrderItem> findByStatus(OrderStatus status);
    List<OrderItem> findByOrderAndStatus(Order order, OrderStatus status);
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.seller = :seller")
    List<OrderItem> findByProductSeller(@Param("seller") User seller);
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.seller = :seller AND oi.status = :status")
    List<OrderItem> findByProductSellerAndStatus(@Param("seller") User seller, @Param("status") OrderStatus status);
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order = :order AND oi.product.seller = :seller")
    List<OrderItem> findByOrderAndProductSeller(@Param("order") Order order, @Param("seller") User seller);
} 
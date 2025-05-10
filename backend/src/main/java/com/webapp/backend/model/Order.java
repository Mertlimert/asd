package com.webapp.backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private LocalDateTime orderDate;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;
    
    @ManyToOne
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;
    
    @ManyToOne
    @JoinColumn(name = "billing_address_id")
    private Address billingAddress;
    
    @Column(nullable = false)
    private String paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Shipment shipment;
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private StripePayment stripePayment;
    
    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
    
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public Address getBillingAddress() {
        return billingAddress;
    }
    
    public void setBillingAddress(Address billingAddress) {
        this.billingAddress = billingAddress;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }
    
    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    
    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
    
    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
    }
    
    // OrderItem'ları yönetmek için yardımcı metodlar
    public void addOrderItem(OrderItem orderItem) {
        orderItem.setOrder(this);
        this.orderItems.add(orderItem);
    }
    
    public void removeOrderItem(OrderItem orderItem) {
        this.orderItems.remove(orderItem);
    }
    
    public Shipment getShipment() {
        return shipment;
    }
    
    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
        if (shipment != null) {
            shipment.setOrder(this);
        }
    }
    
    public StripePayment getStripePayment() {
        return stripePayment;
    }
    
    public void setStripePayment(StripePayment stripePayment) {
        this.stripePayment = stripePayment;
        if (stripePayment != null) {
            stripePayment.setOrder(this);
        }
    }
    
    public Coupon getCoupon() {
        return coupon;
    }
    
    public void setCoupon(Coupon coupon) {
        this.coupon = coupon;
    }
}
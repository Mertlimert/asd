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
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "returns")
public class Return {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDateTime returnDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus status = ReturnStatus.REQUESTED;
    
    @Column(nullable = false)
    private String reasonForReturn;
    
    private BigDecimal refundAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundStatus refundStatus = RefundStatus.PENDING;
    
    private String notes;
    
    @OneToMany(mappedBy = "returnOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnItem> returnItems = new ArrayList<>();
    
    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDateTime returnDate) {
        this.returnDate = returnDate;
    }

    public ReturnStatus getStatus() {
        return status;
    }

    public void setStatus(ReturnStatus status) {
        this.status = status;
    }

    public String getReasonForReturn() {
        return reasonForReturn;
    }

    public void setReasonForReturn(String reasonForReturn) {
        this.reasonForReturn = reasonForReturn;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public RefundStatus getRefundStatus() {
        return refundStatus;
    }

    public void setRefundStatus(RefundStatus refundStatus) {
        this.refundStatus = refundStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<ReturnItem> getReturnItems() {
        return returnItems;
    }

    public void setReturnItems(List<ReturnItem> returnItems) {
        this.returnItems = returnItems;
    }
    
    // Yardımcı metodlar
    public void addReturnItem(ReturnItem returnItem) {
        returnItem.setReturnOrder(this);
        this.returnItems.add(returnItem);
    }
    
    public void removeReturnItem(ReturnItem returnItem) {
        this.returnItems.remove(returnItem);
    }
    
    // Toplam iade edilen ürün sayısını hesapla
    public int getTotalItemCount() {
        return returnItems.stream()
                .mapToInt(ReturnItem::getQuantity)
                .sum();
    }
} 
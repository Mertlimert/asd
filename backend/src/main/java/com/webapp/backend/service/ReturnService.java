package com.webapp.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.RefundStatus;
import com.webapp.backend.model.Return;
import com.webapp.backend.model.ReturnCondition;
import com.webapp.backend.model.ReturnItem;
import com.webapp.backend.model.ReturnReason;
import com.webapp.backend.model.ReturnStatus;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.OrderItemRepository;
import com.webapp.backend.repository.ProductRepository;
import com.webapp.backend.repository.ReturnRepository;

@Service
public class ReturnService {
    
    @Autowired
    private ReturnRepository returnRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public List<Return> getAllReturns() {
        return returnRepository.findAll();
    }
    
    public Optional<Return> getReturnById(Long id) {
        return returnRepository.findById(id);
    }
    
    public List<Return> getReturnsByUser(User user) {
        return returnRepository.findByUser(user);
    }
    
    public List<Return> getReturnsByOrder(Order order) {
        return returnRepository.findByOrder(order);
    }
    
    public List<Return> getReturnsByStatus(ReturnStatus status) {
        return returnRepository.findByStatus(status);
    }
    
    public List<Return> getReturnsBySeller(User seller) {
        return returnRepository.findAll().stream()
                .filter(returnRequest -> returnRequest.getReturnItems().stream()
                        .anyMatch(item -> item.getProduct().getSeller().getId().equals(seller.getId())))
                .collect(Collectors.toList());
    }
    
    @Transactional
    public Return createReturn(User user, Order order, String reasonForReturn) {
        // Sipariş sahibi kontrolü
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bu sipariş size ait değil");
        }
        
        // Yeni iade oluştur
        Return returnRequest = new Return();
        returnRequest.setUser(user);
        returnRequest.setOrder(order);
        returnRequest.setReturnDate(LocalDateTime.now());
        returnRequest.setStatus(ReturnStatus.REQUESTED);
        returnRequest.setReasonForReturn(reasonForReturn);
        returnRequest.setRefundStatus(RefundStatus.PENDING);
        
        return returnRepository.save(returnRequest);
    }
    
    @Transactional
    public ReturnItem addReturnItem(Return returnRequest, OrderItem orderItem, Integer quantity, 
            ReturnReason returnReason, ReturnCondition returnCondition, String additionalComments) {
        
        // Miktar kontrolü
        if (quantity <= 0 || quantity > orderItem.getQuantity()) {
            throw new IllegalArgumentException("Geçersiz iade miktarı");
        }
        
        // İade öğesi oluştur
        ReturnItem returnItem = new ReturnItem();
        returnItem.setReturnOrder(returnRequest);
        returnItem.setOrderItem(orderItem);
        returnItem.setProduct(orderItem.getProduct());
        returnItem.setQuantity(quantity);
        returnItem.setReturnReason(returnReason);
        returnItem.setReturnCondition(returnCondition);
        returnItem.setAdditionalComments(additionalComments);
        
        returnRequest.addReturnItem(returnItem);
        returnRepository.save(returnRequest);
        
        return returnItem;
    }
    
    @Transactional
    public Return updateReturnStatus(Return returnRequest, ReturnStatus newStatus) {
        returnRequest.setStatus(newStatus);
        
        // Eğer iade onaylanmışsa ve ürünler teslim alınmışsa, stoka geri ekle
        if (newStatus == ReturnStatus.RECEIVED) {
            for (ReturnItem item : returnRequest.getReturnItems()) {
                Product product = item.getProduct();
                product.setStock_quantity(product.getStock_quantity() + item.getQuantity());
                productRepository.save(product);
            }
        }
        
        return returnRepository.save(returnRequest);
    }
    
    @Transactional
    public Return processRefund(Return returnRequest, BigDecimal refundAmount) {
        // İade tutarını ayarla
        returnRequest.setRefundAmount(refundAmount);
        returnRequest.setRefundStatus(RefundStatus.PROCESSED);
        returnRequest.setStatus(ReturnStatus.REFUNDED);
        
        return returnRepository.save(returnRequest);
    }
    
    @Transactional
    public Return rejectReturn(Return returnRequest, String notes) {
        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRefundStatus(RefundStatus.REJECTED);
        returnRequest.setNotes(notes);
        
        return returnRepository.save(returnRequest);
    }
} 
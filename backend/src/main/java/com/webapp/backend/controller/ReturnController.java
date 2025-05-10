package com.webapp.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.ReturnRequestDto;
import com.webapp.backend.dto.ReturnResponseDto;
import com.webapp.backend.exception.ErrorCodes;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.exception.ReturnException;
import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.RefundStatus;
import com.webapp.backend.model.Return;
import com.webapp.backend.model.ReturnItem;
import com.webapp.backend.model.ReturnStatus;
import com.webapp.backend.model.User;
import com.webapp.backend.service.OrderService;
import com.webapp.backend.service.ReturnService;
import com.webapp.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired
    private ReturnService returnService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    // İade talebinin yapılabileceği maksimum süre (gün cinsinden)
    private static final int MAX_RETURN_DAYS = 14;
    
    /**
     * Kullanıcıya ait tüm iadeleri getirme endpoint'i
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<ReturnResponseDto>> getUserReturns(@PathVariable Long userId) {
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Kullanıcının iadelerini getir
        List<Return> returns = returnService.getReturnsByUser(user);
        
        // ReturnResponseDto listesine dönüştür
        List<ReturnResponseDto> returnDtos = returns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(returnDtos);
    }
    
    /**
     * Belirli bir siparişe ait tüm iadeleri getirme endpoint'i
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ReturnResponseDto>> getOrderReturns(@PathVariable Long orderId) {
        // Siparişi bul
        Optional<Order> orderOpt = orderService.getOrderById(orderId);
        if (!orderOpt.isPresent()) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        
        // Siparişe ait iadeleri getir
        List<Return> returns = returnService.getReturnsByOrder(orderOpt.get());
        
        // ReturnResponseDto listesine dönüştür
        List<ReturnResponseDto> returnDtos = returns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(returnDtos);
    }
    
    /**
     * Belirli bir iadeyi getirme endpoint'i
     */
    @GetMapping("/{userId}/return/{returnId}")
    public ResponseEntity<ReturnResponseDto> getReturnById(
            @PathVariable Long userId,
            @PathVariable Long returnId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // İadeyi bul
        Optional<Return> returnOpt = returnService.getReturnById(returnId);
        if (!returnOpt.isPresent()) {
            throw new ResourceNotFoundException("Return", "id", returnId);
        }
        
        // İade sahibi kontrolü
        Return returnRequest = returnOpt.get();
        if (!returnRequest.getUser().getId().equals(user.getId())) {
            throw new ReturnException(
                "Bu iade size ait değil", 
                ErrorCodes.UNAUTHORIZED
            );
        }
        
        // ReturnResponseDto'ya dönüştür
        ReturnResponseDto returnDto = convertToDto(returnRequest);
        return ResponseEntity.ok(returnDto);
    }
    
    /**
     * Yeni bir iade talebi oluşturma endpoint'i
     */
    @PostMapping("/{userId}")
    public ResponseEntity<ReturnResponseDto> createReturn(
            @PathVariable Long userId,
            @RequestBody ReturnRequestDto returnRequest) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Siparişi bul
        Optional<Order> orderOpt = orderService.getOrderById(returnRequest.getOrderId());
        if (!orderOpt.isPresent()) {
            throw new ResourceNotFoundException("Order", "id", returnRequest.getOrderId());
        }
        
        Order order = orderOpt.get();
        
        // Sipariş sahibi kontrolü
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ReturnException(
                "Bu sipariş size ait değil", 
                ErrorCodes.UNAUTHORIZED
            );
        }
        
        // Sipariş durumu kontrolü
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new ReturnException(
                "Sadece teslim edilmiş siparişler için iade talebi oluşturabilirsiniz", 
                ErrorCodes.RETURN_INVALID_REASON
            );
        }
        
        // İade süresi kontrolü
        LocalDateTime now = LocalDateTime.now();
        long daysSinceDelivery = ChronoUnit.DAYS.between(order.getOrderDate(), now);
        if (daysSinceDelivery > MAX_RETURN_DAYS) {
            throw new ReturnException(
                "İade süresi dolmuş. Siparişler teslimattan itibaren " + MAX_RETURN_DAYS + " gün içinde iade edilebilir", 
                ErrorCodes.RETURN_PERIOD_EXPIRED
            );
        }
        
        // İade nedeni kontrolü
        if (returnRequest.getReasonForReturn() == null || returnRequest.getReasonForReturn().trim().isEmpty()) {
            throw new ReturnException(
                "İade nedeni belirtilmelidir", 
                ErrorCodes.RETURN_INVALID_REASON
            );
        }
        
        // İade edilecek ürünler kontrolü
        if (returnRequest.getItems() == null || returnRequest.getItems().isEmpty()) {
            throw new ReturnException(
                "En az bir ürün iade edilmelidir", 
                ErrorCodes.RETURN_INVALID_QUANTITY
            );
        }
        
        try {
            // İade oluştur
            Return createdReturn = returnService.createReturn(user, order, returnRequest.getReasonForReturn());
            
            // İade öğelerini ekle
            for (ReturnRequestDto.ReturnItemRequest itemRequest : returnRequest.getItems()) {
                // Sipariş öğesini bul
                OrderItem orderItem = order.getOrderItems().stream()
                        .filter(item -> item.getId().equals(itemRequest.getOrderItemId()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", itemRequest.getOrderItemId()));
                
                // İade miktarı kontrolü
                if (itemRequest.getQuantity() <= 0 || itemRequest.getQuantity() > orderItem.getQuantity()) {
                    throw new ReturnException(
                        "Geçersiz iade miktarı. Maksimum iade miktarı: " + orderItem.getQuantity(), 
                        ErrorCodes.RETURN_INVALID_QUANTITY
                    );
                }
                
                // İade nedeni kontrolü
                if (itemRequest.getReturnReason() == null) {
                    throw new ReturnException(
                        "Her ürün için iade nedeni belirtilmelidir", 
                        ErrorCodes.RETURN_INVALID_REASON
                    );
                }
                
                // İade öğesi ekle
                returnService.addReturnItem(
                        createdReturn, 
                        orderItem, 
                        itemRequest.getQuantity(), 
                        itemRequest.getReturnReason(), 
                        itemRequest.getReturnCondition(), 
                        itemRequest.getAdditionalComments());
            }
            
            // ReturnResponseDto'ya dönüştür
            ReturnResponseDto responseDto = convertToDto(createdReturn);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalArgumentException e) {
            throw new ReturnException(e.getMessage(), ErrorCodes.RETURN_INVALID_QUANTITY);
        }
    }
    
    /**
     * İade durumunu güncelleme endpoint'i (Admin için)
     */
    @PutMapping("/{returnId}/status")
    public ResponseEntity<ReturnResponseDto> updateReturnStatus(
            @PathVariable Long returnId,
            @RequestBody ReturnStatus newStatus) {
        
        // İadeyi bul
        Optional<Return> returnOpt = returnService.getReturnById(returnId);
        if (!returnOpt.isPresent()) {
            throw new ResourceNotFoundException("Return", "id", returnId);
        }
        
        Return returnRequest = returnOpt.get();
        
        // İade durumu kontrolü
        validateReturnStatusChange(returnRequest.getStatus(), newStatus);
        
        // İade durumunu güncelle
        Return updatedReturn = returnService.updateReturnStatus(returnRequest, newStatus);
        
        // ReturnResponseDto'ya dönüştür
        ReturnResponseDto returnDto = convertToDto(updatedReturn);
        return ResponseEntity.ok(returnDto);
    }
    
    /**
     * Geri ödeme işleme endpoint'i (Admin için)
     */
    @PutMapping("/{returnId}/refund")
    public ResponseEntity<ReturnResponseDto> processRefund(
            @PathVariable Long returnId,
            @RequestBody BigDecimal refundAmount) {
        
        // İadeyi bul
        Optional<Return> returnOpt = returnService.getReturnById(returnId);
        if (!returnOpt.isPresent()) {
            throw new ResourceNotFoundException("Return", "id", returnId);
        }
        
        Return returnRequest = returnOpt.get();
        
        // İade durumu kontrolü
        if (returnRequest.getStatus() != ReturnStatus.RECEIVED) {
            throw new ReturnException(
                "Sadece teslim alınmış iade talepleri için geri ödeme işlemi yapılabilir", 
                ErrorCodes.RETURN_ALREADY_PROCESSED
            );
        }
        
        // Geri ödeme tutarı kontrolü
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReturnException(
                "Geri ödeme tutarı sıfırdan büyük olmalıdır", 
                ErrorCodes.RETURN_INVALID_REASON
            );
        }
        
        // Geri ödeme işle
        Return updatedReturn = returnService.processRefund(returnRequest, refundAmount);
        
        // ReturnResponseDto'ya dönüştür
        ReturnResponseDto returnDto = convertToDto(updatedReturn);
        return ResponseEntity.ok(returnDto);
    }
    
    /**
     * İade talebini reddetme endpoint'i (Admin için)
     */
    @PutMapping("/{returnId}/reject")
    public ResponseEntity<ReturnResponseDto> rejectReturn(
            @PathVariable Long returnId,
            @RequestBody String notes) {
        
        // İadeyi bul
        Optional<Return> returnOpt = returnService.getReturnById(returnId);
        if (!returnOpt.isPresent()) {
            throw new ResourceNotFoundException("Return", "id", returnId);
        }
        
        Return returnRequest = returnOpt.get();
        
        // İade durumu kontrolü
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new ReturnException(
                "Sadece talep durumundaki iadeler reddedilebilir", 
                ErrorCodes.RETURN_ALREADY_PROCESSED
            );
        }
        
        // İade red nedeni kontrolü
        if (notes == null || notes.trim().isEmpty()) {
            throw new ReturnException(
                "Red nedeni belirtilmelidir", 
                ErrorCodes.RETURN_INVALID_REASON
            );
        }
        
        // İadeyi reddet
        Return updatedReturn = returnService.rejectReturn(returnRequest, notes);
        
        // ReturnResponseDto'ya dönüştür
        ReturnResponseDto returnDto = convertToDto(updatedReturn);
        return ResponseEntity.ok(returnDto);
    }
    
    /**
     * Return entity'sini ReturnResponseDto'ya dönüştürür
     */
    private ReturnResponseDto convertToDto(Return returnEntity) {
        ReturnResponseDto dto = new ReturnResponseDto();
        dto.setId(returnEntity.getId());
        dto.setOrderId(returnEntity.getOrder().getId());
        dto.setReturnDate(returnEntity.getReturnDate());
        dto.setStatus(returnEntity.getStatus());
        dto.setReasonForReturn(returnEntity.getReasonForReturn());
        dto.setRefundAmount(returnEntity.getRefundAmount());
        dto.setRefundStatus(returnEntity.getRefundStatus());
        
        // İade öğelerini dönüştür
        List<ReturnResponseDto.ReturnItemResponse> itemDtos = returnEntity.getReturnItems().stream()
                .map(item -> {
                    ReturnResponseDto.ReturnItemResponse itemDto = new ReturnResponseDto.ReturnItemResponse();
                    itemDto.setId(item.getId());
                    itemDto.setOrderItemId(item.getOrderItem().getId());
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setProductImage(item.getProduct().getImage_url());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setReturnReason(item.getReturnReason());
                    itemDto.setReturnCondition(item.getReturnCondition());
                    itemDto.setAdditionalComments(item.getAdditionalComments());
                    return itemDto;
                })
                .collect(Collectors.toList());
        
        dto.setItems(itemDtos);
        
        return dto;
    }
    
    /**
     * İade durumu değişikliğinin geçerliliğini kontrol eder
     */
    private void validateReturnStatusChange(ReturnStatus currentStatus, ReturnStatus newStatus) {
        if (currentStatus == null || newStatus == null) {
            throw new ReturnException(
                "Geçersiz iade durumu", 
                ErrorCodes.RETURN_INVALID_REASON
            );
        }
        
        // ReturnStatus sırası: REQUESTED -> APPROVED -> RECEIVED -> REFUNDED
        // Ya da: REQUESTED -> REJECTED
        switch (currentStatus) {
            case REQUESTED:
                // REQUESTED durumundan APPROVED veya REJECTED'a geçilebilir
                if (newStatus != ReturnStatus.APPROVED && newStatus != ReturnStatus.REJECTED) {
                    throw new ReturnException(
                        "Talep durumundaki iade sadece onaylanabilir veya reddedilebilir", 
                        ErrorCodes.RETURN_INVALID_REASON
                    );
                }
                break;
            case APPROVED:
                // APPROVED durumundan sadece RECEIVED'a geçilebilir
                if (newStatus != ReturnStatus.RECEIVED) {
                    throw new ReturnException(
                        "Onaylanmış iade sadece teslim alındı olarak işaretlenebilir", 
                        ErrorCodes.RETURN_INVALID_REASON
                    );
                }
                break;
            case RECEIVED:
                // RECEIVED durumundan sadece REFUNDED'a geçilebilir
                if (newStatus != ReturnStatus.REFUNDED) {
                    throw new ReturnException(
                        "Teslim alınmış iade sadece iade edildi olarak işaretlenebilir", 
                        ErrorCodes.RETURN_INVALID_REASON
                    );
                }
                break;
            case REFUNDED:
            case REJECTED:
                // Final durumlar değiştirilemez
                throw new ReturnException(
                    "Bu iade durumu değiştirilemez", 
                    ErrorCodes.RETURN_ALREADY_PROCESSED
                );
            default:
                throw new ReturnException(
                    "Geçersiz iade durumu", 
                    ErrorCodes.RETURN_INVALID_REASON
                );
        }
    }
} 
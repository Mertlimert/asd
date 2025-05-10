package com.webapp.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.CheckoutSessionDto;
import com.webapp.backend.dto.PaymentMethodDto;
import com.webapp.backend.dto.PaymentResponseDto;
import com.webapp.backend.model.Order;
import com.webapp.backend.model.StripePayment;
import com.webapp.backend.model.StripePaymentMethod;
import com.webapp.backend.model.User;
import com.webapp.backend.service.OrderService;
import com.webapp.backend.service.StripeService;
import com.webapp.backend.service.UserService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getStripeConfig() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", stripeService.getPublicKey());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/payment-methods")
    @PreAuthorize("hasAnyRole('USER', 'SELLER', 'ADMIN')")
    public ResponseEntity<StripePaymentMethod> addPaymentMethod(@RequestBody PaymentMethodDto paymentMethodDto) {
        User user = userService.getCurrentUser();
        
        StripePaymentMethod paymentMethod = stripeService.addPaymentMethod(
            user,
            paymentMethodDto.getCardNumber(),
            paymentMethodDto.getExpiryMonth(),
            paymentMethodDto.getExpiryYear(),
            paymentMethodDto.getCvc(),
            paymentMethodDto.getCardHolderName(),
            paymentMethodDto.isMakeDefault()
        );
        
        return ResponseEntity.ok(paymentMethod);
    }
    
    @PostMapping("/create-checkout-session/{orderId}")
    @PreAuthorize("hasAnyRole('USER', 'SELLER', 'ADMIN')")
    public ResponseEntity<PaymentResponseDto> createCheckoutSession(
            @PathVariable Long orderId,
            @RequestBody CheckoutSessionDto checkoutSessionDto) {
        
        User user = userService.getCurrentUser();
        Optional<Order> orderOptional = orderService.getOrderById(orderId);
        
        if (!orderOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Order order = orderOptional.get();
        
        // Sipariş sahibini kontrol et
        if (!order.getUser().getId().equals(user.getId()) && !userService.isAdmin(user)) {
            return ResponseEntity.badRequest().build();
        }
        
        String sessionUrl = stripeService.createCheckoutSession(
            order,
            checkoutSessionDto.getSuccessUrl(),
            checkoutSessionDto.getCancelUrl()
        );
        
        PaymentResponseDto response = new PaymentResponseDto();
        response.setSessionUrl(sessionUrl);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/webhook")
    public ResponseEntity<?> handleStripeWebhook(@RequestBody String payload) {
        // Webhook işlevselliği burada gerçekleştirilecek
        // Şimdilik basit bir onay dönüyoruz
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/success/{paymentIntentId}")
    public ResponseEntity<StripePayment> handlePaymentSuccess(@PathVariable String paymentIntentId) {
        StripePayment payment = stripeService.handlePaymentSuccess(paymentIntentId);
        return ResponseEntity.ok(payment);
    }
} 
package com.webapp.backend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.CartResponseDto;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.exception.BadRequestException;
import com.webapp.backend.model.Cart;
import com.webapp.backend.model.CartItem;
import com.webapp.backend.model.User;
import com.webapp.backend.service.CartService;
import com.webapp.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    @Autowired
    public CartController(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CartResponseDto> getUserCart(@PathVariable Long userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Cart cart = cartService.getCartByUser(user);
        CartResponseDto cartResponseDto = convertToDto(cart);
        return ResponseEntity.ok(cartResponseDto);
    }

    @PostMapping("/{userId}/product/{productId}")
    public ResponseEntity<CartResponseDto> addProductToCart(
            @PathVariable Long userId,
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        try {
            Cart cart = cartService.addProductToCart(user, productId, quantity);
            CartResponseDto cartResponseDto = convertToDto(cart);
            return ResponseEntity.ok(cartResponseDto);
        } catch (Exception e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @PutMapping("/{userId}/product/{productId}")
    public ResponseEntity<CartResponseDto> updateProductQuantity(
            @PathVariable Long userId,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        try {
            Cart cart = cartService.updateProductQuantity(user, productId, quantity);
            CartResponseDto cartResponseDto = convertToDto(cart);
            return ResponseEntity.ok(cartResponseDto);
        } catch (Exception e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @DeleteMapping("/{userId}/product/{productId}")
    public ResponseEntity<CartResponseDto> removeProductFromCart(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Cart cart = cartService.removeProductFromCart(user, productId);
        CartResponseDto cartResponseDto = convertToDto(cart);
        return ResponseEntity.ok(cartResponseDto);
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<CartResponseDto> clearCart(@PathVariable Long userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Cart cart = cartService.clearCart(user);
        CartResponseDto cartResponseDto = convertToDto(cart);
        return ResponseEntity.ok(cartResponseDto);
    }
    
    @GetMapping("/{userId}/total")
    public ResponseEntity<Double> getCartTotal(@PathVariable Long userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Double total = cartService.getCartTotal(user);
        return ResponseEntity.ok(total);
    }
    
    /**
     * Cart entity'sini CartResponseDto'ya dönüştürür
     */
    private CartResponseDto convertToDto(Cart cart) {
        CartResponseDto dto = new CartResponseDto();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUser().getId());
        dto.setTotalPrice(calculateTotalPrice(cart));
        dto.setUpdatedAt(LocalDateTime.now());
        
        // Sepet ürünlerini dönüştür
        if (cart.getCartItems() != null) {
            List<CartResponseDto.CartItemDto> itemDtos = cart.getCartItems().stream()
                    .map(this::convertCartItemToDto)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        } else {
            dto.setItems(new ArrayList<>());
        }
        
        return dto;
    }
    
    /**
     * CartItem entity'sini CartItemDto'ya dönüştürür
     */
    private CartResponseDto.CartItemDto convertCartItemToDto(CartItem item) {
        CartResponseDto.ProductSummaryDto productDto = new CartResponseDto.ProductSummaryDto(
            item.getProduct().getId(),
            item.getProduct().getName(),
            item.getProduct().getPrice(),
            item.getProduct().getImage_url()
        );
        
        Double subtotal = item.getQuantity() * item.getProduct().getPrice();
        
        return new CartResponseDto.CartItemDto(
            item.getId(),
            productDto,
            item.getQuantity(),
            subtotal
        );
    }
    
    /**
     * Sepetteki toplam fiyatı hesaplar
     */
    private Double calculateTotalPrice(Cart cart) {
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            return 0.0;
        }
        
        return cart.getCartItems().stream()
                .mapToDouble(item -> item.getQuantity() * item.getProduct().getPrice())
                .sum();
    }
}
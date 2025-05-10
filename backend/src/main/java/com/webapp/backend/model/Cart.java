package com.webapp.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "carts")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    @JsonIgnore
    private User user;
    
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CartItem> cartItems = new ArrayList<>();
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public List<CartItem> getCartItems() {
        return cartItems;
    }

    public void setCartItems(List<CartItem> cartItems) {
        this.cartItems = cartItems;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    
    // Calculate total price of all items in the cart
    public Double getTotalPrice() {
        return cartItems.stream()
            .mapToDouble(item -> item.getQuantity() * item.getProduct().getPrice())
            .sum();
    }
    
    // Helper method to add product to cart
    public void addItem(Product product, int quantity) {
        CartItem existingItem = findCartItem(product.getId());
        
        if (existingItem != null) {
            // If product already exists in cart, update quantity
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            // Otherwise create new cart item
            CartItem newItem = new CartItem();
            newItem.setCart(this);
            newItem.setProduct(product);
            newItem.setQuantity(quantity);
            newItem.setAddedAt(LocalDateTime.now());
            this.cartItems.add(newItem);
        }
        this.updatedAt = LocalDateTime.now();
    }
    
    // Helper method to remove item from cart
    public void removeItem(Long productId) {
        CartItem item = findCartItem(productId);
        if (item != null) {
            this.cartItems.remove(item);
            this.updatedAt = LocalDateTime.now();
        }
    }
    
    // Helper method to update item quantity
    public void updateItemQuantity(Long productId, int quantity) {
        CartItem item = findCartItem(productId);
        if (item != null) {
            // Stok kontrolü burada yapılmıyor çünkü bu kontrol service katmanında yapılıyor
            item.setQuantity(quantity);
            this.updatedAt = LocalDateTime.now();
        }
    }
    
    // Helper method to find cart item by product id
    private CartItem findCartItem(Long productId) {
        return this.cartItems.stream()
            .filter(item -> item.getProduct().getId().equals(productId))
            .findFirst()
            .orElse(null);
    }
    
    // Clear the cart
    public void clear() {
        this.cartItems.clear();
        this.updatedAt = LocalDateTime.now();
    }
}
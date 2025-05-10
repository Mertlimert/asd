package com.webapp.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.webapp.backend.model.Cart;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.CartRepository;
import com.webapp.backend.repository.ProductRepository;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Autowired
    public CartService(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    public Cart getCartByUser(User user) {
        Optional<Cart> existingCart = cartRepository.findByUser(user);
        if (existingCart.isPresent()) {
            return existingCart.get();
        } else {
            // Kullanıcının sepeti yoksa yeni bir sepet oluştur
            Cart newCart = new Cart();
            newCart.setUser(user);
            newCart.setCreatedAt(LocalDateTime.now());
            newCart.setUpdatedAt(LocalDateTime.now());
            return cartRepository.save(newCart);
        }
    }

    public Cart addProductToCart(User user, Long productId, Integer quantity) {
        Cart cart = getCartByUser(user);
        
        // Ürünü bul
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı"));
        
        // Stok kontrolü yap
        if (product.getStock_quantity() < quantity) {
            throw new RuntimeException("Yeterli stok yok");
        }
        
        // Sepete ekle
        cart.addItem(product, quantity);
        
        return cartRepository.save(cart);
    }

    public Cart updateProductQuantity(User user, Long productId, Integer quantity) {
        Cart cart = getCartByUser(user);
        
        if (quantity <= 0) {
            // Eğer miktar 0 veya daha azsa, ürünü sepetten kaldır
            cart.removeItem(productId);
        } else {
            // Ürünü bul
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı"));
            
            // Stok kontrolü yap
            if (product.getStock_quantity() < quantity) {
                throw new RuntimeException("Yeterli stok yok");
            }
            
            // Aksi takdirde miktarı güncelle
            cart.updateItemQuantity(productId, quantity);
        }
        
        return cartRepository.save(cart);
    }

    public Cart removeProductFromCart(User user, Long productId) {
        Cart cart = getCartByUser(user);
        cart.removeItem(productId);
        return cartRepository.save(cart);
    }

    public Cart clearCart(User user) {
        Cart cart = getCartByUser(user);
        cart.clear();
        return cartRepository.save(cart);
    }
    
    public Double getCartTotal(User user) {
        Cart cart = getCartByUser(user);
        return cart.getTotalPrice();
    }
}
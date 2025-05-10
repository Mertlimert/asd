package com.webapp.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.OrderRequestDto;
import com.webapp.backend.dto.OrderResponseDto;
import com.webapp.backend.exception.ErrorCodes;
import com.webapp.backend.exception.OrderException;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.Address;
import com.webapp.backend.model.Cart;
import com.webapp.backend.model.Coupon;
import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.PaymentStatus;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;
import com.webapp.backend.model.Role;
import com.webapp.backend.repository.OrderItemRepository;
import com.webapp.backend.repository.ProductRepository;
import com.webapp.backend.service.AddressService;
import com.webapp.backend.service.CartService;
import com.webapp.backend.service.CouponService;
import com.webapp.backend.service.OrderService;
import com.webapp.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private CartService cartService;
    
    @Autowired
    private AddressService addressService;
    
    @Autowired
    private CouponService couponService;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    /**
     * Sepetten doğrudan sipariş oluşturma endpoint'i (Stripe entegrasyonu için)
     */
    @PostMapping("/checkout-from-cart")
    public ResponseEntity<OrderResponseDto> createOrderFromCart() {
        // Mevcut oturum açmış kullanıcıyı al
        User currentUser = userService.getCurrentUser();
        
        // Kullanıcının sepetini getir
        Cart cart = cartService.getCartByUser(currentUser);
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new OrderException("Sepet boş, sipariş oluşturulamaz", ErrorCodes.ORDER_EMPTY_CART);
        }
        
        // Kullanıcının varsayılan adresini getir
        Optional<Address> defaultAddressOpt = addressService.getDefaultAddress(currentUser);
        if (!defaultAddressOpt.isPresent()) {
            throw new OrderException("Varsayılan adres bulunamadı", ErrorCodes.ADDRESS_INVALID);
        }
        
        Address defaultAddress = defaultAddressOpt.get();
        
        try {
            // Siparişi oluştur (fatura adresi aynı, ödeme yöntemi CREDIT_CARD)
            Order createdOrder = orderService.createOrderFromCart(
                    currentUser, 
                    cart, 
                    defaultAddress, 
                    defaultAddress,  // Fatura adresi aynı
                    "CREDIT_CARD",   // Ödeme yöntemi kartla ödeme
                    null);           // Kupon yok
            
            // OrderResponseDto'ya dönüştür ve yanıt ver
            OrderResponseDto responseDto = convertToDto(createdOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalStateException e) {
            // OrderService'den gelen stok veya diğer hatalar
            if (e.getMessage().contains("stokta yeterli sayıda yok")) {
                throw new OrderException(e.getMessage(), ErrorCodes.ORDER_INSUFFICIENT_STOCK);
            } else {
                throw new OrderException(e.getMessage(), ErrorCodes.ORDER_EMPTY_CART);
            }
        }
    }
    
    /**
     * Sipariş oluşturma endpoint'i
     */
    @PostMapping("/{userId}")
    public ResponseEntity<OrderResponseDto> createOrder(
            @PathVariable Long userId,
            @RequestBody OrderRequestDto orderRequest) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Kullanıcı sepetini getir
        Cart cart = cartService.getCartByUser(user);
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new OrderException("Sepet boş, sipariş oluşturulamaz", ErrorCodes.ORDER_EMPTY_CART);
        }
        
        // Teslimat ve fatura adreslerini bul
        Address shippingAddress = addressService.getUserAddressById(user, orderRequest.getShippingAddressId());
        if (shippingAddress == null) {
            throw new ResourceNotFoundException("Address", "id", orderRequest.getShippingAddressId());
        }
        
        Address billingAddress = null;
        if (orderRequest.getBillingAddressId() != null) {
            billingAddress = addressService.getUserAddressById(user, orderRequest.getBillingAddressId());
            if (billingAddress == null) {
                throw new ResourceNotFoundException("Address", "id", orderRequest.getBillingAddressId());
            }
        }
        
        // Kupon kodunu kontrol et (varsa)
        Coupon coupon = null;
        if (orderRequest.getCouponCode() != null && !orderRequest.getCouponCode().isEmpty()) {
            coupon = couponService.getCouponByCode(orderRequest.getCouponCode());
            // Kuponun geçerliliğini kontrol et
            if (coupon != null && !coupon.getIsActive()) {
                throw new OrderException("Bu kupon aktif değil", ErrorCodes.COUPON_INVALID);
            }
        }
        
        try {
            // Siparişi oluştur
            Order createdOrder = orderService.createOrderFromCart(
                    user, 
                    cart, 
                    shippingAddress, 
                    billingAddress, 
                    orderRequest.getPaymentMethod(), 
                    coupon);
            
            // OrderResponseDto'ya dönüştür ve yanıt ver
            OrderResponseDto responseDto = convertToDto(createdOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalStateException e) {
            // OrderService'den gelen stok veya diğer hatalar
            if (e.getMessage().contains("stokta yeterli sayıda yok")) {
                throw new OrderException(e.getMessage(), ErrorCodes.ORDER_INSUFFICIENT_STOCK);
            } else {
                throw new OrderException(e.getMessage(), ErrorCodes.ORDER_EMPTY_CART);
            }
        }
    }
    
    /**
     * Kullanıcıya ait siparişleri getirme endpoint'i
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<OrderResponseDto>> getUserOrders(@PathVariable Long userId) {
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Kullanıcı siparişlerini getir
        List<Order> orders = orderService.getUserOrders(user);
        
        // OrderResponseDto listesine dönüştür
        List<OrderResponseDto> orderDtos = orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(orderDtos);
    }
    
    /**
     * Belirli bir siparişi getirme endpoint'i
     */
    @GetMapping("/{userId}/order/{orderId}")
    public ResponseEntity<OrderResponseDto> getOrderById(
            @PathVariable Long userId,
            @PathVariable Long orderId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Siparişi bul
        Order order = orderService.getOrderByIdAndUser(orderId, user);
        if (order == null) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        
        // OrderResponseDto'ya dönüştür
        OrderResponseDto orderDto = convertToDto(order);
        return ResponseEntity.ok(orderDto);
    }
    
    /**
     * Sipariş durumunu güncelleme endpoint'i (Admin için)
     * String olarak gelen durum değerini OrderStatus enum'a çevirir
     */
    @PutMapping(value = "/{orderId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<OrderResponseDto> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody String statusValue) {
        
        try {
            // Gelen string değeri temizle (tırnak işaretlerini kaldır)
            statusValue = statusValue.replace("\"", "");
            
            // Enum değerine çevir
            OrderStatus status = OrderStatus.valueOf(statusValue);
            
            // Siparişi bul
            Order order = orderService.getOrderById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
            
            // Durumu güncelle
            order.setStatus(status);
            order = orderService.updateOrder(order);
            
            // OrderResponseDto'ya dönüştür
            OrderResponseDto orderDto = convertToDto(order);
            return ResponseEntity.ok(orderDto);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + statusValue);
        }
    }
    
    /**
     * Ödeme durumunu güncelleme endpoint'i (Admin veya ödeme işlemi için)
     * String olarak gelen durum değerini PaymentStatus enum'a çevirir
     */
    @PutMapping(value = "/{orderId}/payment", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<OrderResponseDto> updatePaymentStatus(
            @PathVariable Long orderId,
            @RequestBody String statusValue) {
        
        try {
            // Gelen string değeri temizle (tırnak işaretlerini kaldır)
            statusValue = statusValue.replace("\"", "");
            
            // Enum değerine çevir
            PaymentStatus newStatus = PaymentStatus.valueOf(statusValue);
            
            // Siparişi bul
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (!orderOpt.isPresent()) {
                throw new ResourceNotFoundException("Order", "id", orderId);
            }
            
            Order order = orderOpt.get();
            
            // İptal edilmiş siparişlerde ödeme durumu değiştirilemez
            if (order.getStatus() == OrderStatus.CANCELLED) {
                throw new OrderException(
                    "İptal edilmiş siparişlerde ödeme durumu değiştirilemez", 
                    ErrorCodes.ORDER_INVALID_STATUS
                );
            }
            
            // Ödeme durumunu güncelle
            Order updatedOrder = orderService.updatePaymentStatus(order, newStatus);
            
            // OrderResponseDto'ya dönüştür
            OrderResponseDto orderDto = convertToDto(updatedOrder);
            return ResponseEntity.ok(orderDto);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid payment status: " + statusValue);
        }
    }
    
    /**
     * Sipariş iptal etme endpoint'i
     */
    @PutMapping("/{userId}/order/{orderId}/cancel")
    public ResponseEntity<OrderResponseDto> cancelOrder(
            @PathVariable Long userId,
            @PathVariable Long orderId) {
        
        // Kullanıcıyı bul
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Siparişi bul
        Order order = orderService.getOrderByIdAndUser(orderId, user);
        if (order == null) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        
        // Sadece belirli durumlardaki siparişler iptal edilebilir
        if (order.getStatus() != OrderStatus.PENDING && 
            order.getStatus() != OrderStatus.PROCESSING &&
            order.getStatus() != OrderStatus.CONFIRMED) {
            throw new OrderException(
                "Bu aşamadaki sipariş iptal edilemez. Lütfen müşteri hizmetleri ile iletişime geçin.", 
                ErrorCodes.ORDER_CANCEL_LIMIT
            );
        }
        
        // Siparişi iptal et
        orderService.cancelOrder(order);
        
        // OrderResponseDto'ya dönüştür
        OrderResponseDto orderDto = convertToDto(order);
        return ResponseEntity.ok(orderDto);
    }
    
    /**
     * Satıcının ürünlerini içeren siparişleri getirme endpoint'i
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<OrderResponseDto>> getSellerOrders(@PathVariable Long sellerId) {
        // Satıcıyı bul
        User seller = userService.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));
        
        // Satıcının siparişlerini getir
        List<Order> orders = orderService.getOrdersContainingSellerProducts(seller);
        
        // OrderResponseDto listesine dönüştür
        List<OrderResponseDto> orderDtos = orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(orderDtos);
    }
    
    /**
     * Tüm siparişleri getiren endpoint (Admin için)
     */
    @GetMapping("/all")
    public ResponseEntity<List<OrderResponseDto>> getAllOrders() {
        // Tüm siparişleri getir
        List<Order> orders = orderService.getAllOrders();
        
        // OrderResponseDto listesine dönüştür
        List<OrderResponseDto> orderDtos = orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(orderDtos);
    }
    
    /**
     * Satıcının sipariş durumunu güncellemesini sağlayan endpoint
     * Satıcı sadece kendi ürünlerini içeren siparişleri güncelleyebilir
     */
    @PutMapping(value = "/seller/{sellerId}/order/{orderId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateOrderStatusBySeller(
            @PathVariable Long sellerId,
            @PathVariable Long orderId,
            @RequestBody String statusValue) {
        
        try {
            // Satıcıyı bul
            User seller = userService.findById(sellerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));
            
            // Siparişi bul
            Order order = orderService.getOrderById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
            
            // Satıcının ürünlerini bul
            List<Product> sellerProducts = productRepository.findBySeller(seller);
            
            // Siparişin satıcının ürünlerini içerip içermediğini kontrol et
            boolean containsSellerProducts = order.getOrderItems().stream()
                    .anyMatch(item -> sellerProducts.contains(item.getProduct()));
            
            if (!containsSellerProducts) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Bu sipariş sizin ürünlerinizi içermiyor.");
            }
            
            // Gelen string değeri temizle (tırnak işaretlerini kaldır)
            statusValue = statusValue.replace("\"", "");
            
            // Enum değerine çevir
            OrderStatus status = OrderStatus.valueOf(statusValue);
            
            // Durumu güncelle
            order.setStatus(status);
            order = orderService.updateOrder(order);
            
            // OrderResponseDto'ya dönüştür
            OrderResponseDto orderDto = convertToDto(order);
            return ResponseEntity.ok(orderDto);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + statusValue);
        }
    }
    
    /**
     * Satıcının bir siparişte bulunan kendi ürünlerinin durumunu güncelleme
     */
    @PutMapping(value = "/seller/{sellerId}/order/{orderId}/items/status")
    public ResponseEntity<?> updateOrderItemsStatusBySeller(
            @PathVariable Long sellerId,
            @PathVariable Long orderId,
            @RequestBody Map<String, String> statusMap) {
        
        // Satıcıyı bul
        User seller = userService.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", sellerId));
        
        // Satıcının yetkisini kontrol et
        if (seller.getRole() != Role.SELLER && seller.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bu işlem için satıcı yetkisi gerekli");
        }
        
        // Siparişi bul
        Order order = orderService.getOrderById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        try {
            // Durum değerini Map'ten al
            String statusValue = statusMap.get("status");
            if (statusValue == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Geçersiz sipariş durumu: 'status' parametresi gerekli");
            }
            
            // Durum değerini enum'a dönüştür
            OrderStatus newStatus = OrderStatus.valueOf(statusValue);
            
            // Satıcının bu siparişte bulunan ürünlerinin durumunu güncelle
            List<OrderItem> updatedItems = orderService.updateOrderItemsStatus(order, seller, newStatus);
            
            if (updatedItems.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Bu siparişte satıcıya ait ürün bulunamadı");
            }
            
            // Güncellenmiş siparişi döndür
            OrderResponseDto responseDto = convertToDto(order);
            return ResponseEntity.ok(responseDto);
            
        } catch (IllegalArgumentException e) {
            // Geçersiz durum değeri hatası
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Geçersiz sipariş durumu: " + statusMap.get("status"));
        } catch (Exception e) {
            // Diğer olası hatalar
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Sipariş durumu güncellenirken bir hata oluştu: " + e.getMessage());
        }
    }
    
    /**
     * Belirli bir sipariş öğesinin durumunu güncelleme (Admin için)
     */
    @PutMapping(value = "/admin/order-item/{orderItemId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateOrderItemStatus(
            @PathVariable Long orderItemId,
            @RequestBody String statusValue) {
        
        // Mevcut kullanıcıyı kontrol et - sadece admin yetkisi
        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bu işlem için admin yetkisi gerekli");
        }
        
        // Sipariş öğesini bul
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", orderItemId));
        
        try {
            // Durum değerini ayrıştır ve enum'a dönüştür
            OrderStatus newStatus = OrderStatus.valueOf(statusValue.replaceAll("\"", ""));
            
            // Sipariş öğesinin durumunu güncelle
            OrderItem updatedItem = orderService.updateOrderItemStatus(orderItem, newStatus);
            
            // Güncellenmiş siparişi döndür
            OrderResponseDto responseDto = convertToDto(updatedItem.getOrder());
            return ResponseEntity.ok(responseDto);
            
        } catch (IllegalArgumentException e) {
            // Geçersiz durum değeri hatası
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Geçersiz sipariş durumu: " + statusValue);
        } catch (Exception e) {
            // Diğer olası hatalar
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Sipariş durumu güncellenirken bir hata oluştu: " + e.getMessage());
        }
    }
    
    /**
     * Order entity'sini OrderResponseDto'ya dönüştürür
     */
    private OrderResponseDto convertToDto(Order order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setOrderDate(order.getOrderDate());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        
        // Kullanıcı bilgilerini ekle
        if (order.getUser() != null) {
            dto.setUserId(order.getUser().getId());
            dto.setUserFirstName(order.getUser().getFirstName());
            dto.setUserLastName(order.getUser().getLastName());
        }
        
        // Kargo takip numarası (eğer kargo bilgisi varsa)
        String trackingNumber = null;
        if (order.getShipment() != null) {
            trackingNumber = order.getShipment().getTrackingNumber();
        }
        dto.setTrackingNumber(trackingNumber);
        
        dto.setHasCoupon(order.getCoupon() != null);
        
        // Teslimat adresi bilgilerini doldur
        OrderResponseDto.AddressDto addressDto = new OrderResponseDto.AddressDto();
        addressDto.setId(order.getShippingAddress().getId());
        addressDto.setRecipientName(order.getShippingAddress().getRecipientName());
        addressDto.setAddressLine1(order.getShippingAddress().getAddressLine1());
        addressDto.setAddressLine2(order.getShippingAddress().getAddressLine2());
        addressDto.setCity(order.getShippingAddress().getCity());
        addressDto.setPostalCode(order.getShippingAddress().getPostalCode());
        addressDto.setCountry(order.getShippingAddress().getCountry());
        addressDto.setPhoneNumber(order.getShippingAddress().getPhoneNumber());
        dto.setShippingAddress(addressDto);
        
        // Sipariş ürünlerini dönüştür
        List<OrderItem> orderItems = order.getOrderItems();
        List<OrderResponseDto.OrderItemDto> itemDtos = orderItems.stream()
                .map(item -> {
                    OrderResponseDto.OrderItemDto itemDto = new OrderResponseDto.OrderItemDto();
                    itemDto.setId(item.getId());
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setProductImage(item.getProduct().getImage_url());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setPrice(item.getPrice());
                    itemDto.setSubtotal(item.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())));
                    itemDto.setSellerId(item.getProduct().getSeller().getId());
                    itemDto.setStatus(item.getStatus().toString());
                    return itemDto;
                })
                .collect(Collectors.toList());
        
        dto.setItems(itemDtos);
        
        return dto;
    }
} 
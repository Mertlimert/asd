package com.webapp.backend.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.SellerAnalyticsDto;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.Order;
import com.webapp.backend.model.OrderItem;
import com.webapp.backend.model.OrderStatus;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.Return;
import com.webapp.backend.model.User;
import com.webapp.backend.service.OrderService;
import com.webapp.backend.service.ProductService;
import com.webapp.backend.service.ReturnService;
import com.webapp.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/seller/analytics")
public class SellerAnalyticsController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ReturnService returnService;
    
    @GetMapping("/{sellerId}")
    public ResponseEntity<SellerAnalyticsDto> getSellerAnalytics(
            @PathVariable Long sellerId,
            @RequestParam(required = false) String timeRange) {
        
        // Satıcıyı bul
        User seller = userService.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));
        
        // Zaman aralığını belirle (varsayılan: son 30 gün)
        String period = timeRange != null ? timeRange : "last30days";
        
        // Satıcıya ait tüm siparişleri getir - Bu metodu servis sınıfında oluşturmalısınız 
        List<Order> sellerOrders = new ArrayList<>();
        List<Order> allOrders = orderService.getAllOrders();
        for (Order order : allOrders) {
            boolean sellerHasItemInOrder = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(sellerId));
            if (sellerHasItemInOrder) {
                sellerOrders.add(order);
            }
        }
        
        // Satıcının ürünlerini getir
        List<Product> sellerProducts = productService.findBySeller(seller);
        
        // Satıcının tüm siparişlerindeki ürünleri getir
        List<OrderItem> sellerOrderItems = new ArrayList<>();
        for (Order order : sellerOrders) {
            List<OrderItem> filteredItems = order.getOrderItems().stream()
                    .filter(item -> item.getProduct().getSeller().getId().equals(sellerId))
                    .collect(Collectors.toList());
            sellerOrderItems.addAll(filteredItems);
        }
        
        // Analitiği hesapla ve DTO oluştur
        SellerAnalyticsDto analyticsDto = calculateAnalytics(seller, sellerOrders, sellerProducts, sellerOrderItems, period);
        
        return ResponseEntity.ok(analyticsDto);
    }
    
    private SellerAnalyticsDto calculateAnalytics(
            User seller, 
            List<Order> orders, 
            List<Product> products,
            List<OrderItem> orderItems,
            String period) {
        
        SellerAnalyticsDto analyticsDto = new SellerAnalyticsDto();
        
        // Temel istatistikler
        double totalRevenue = 0.0;
        int completedOrders = 0;
        int pendingOrders = 0;
        int cancelledOrders = 0;
        
        // Her bir sipariş kalemini analiz et
        for (OrderItem item : orderItems) {
            // Satıcıya ait ürünleri hesapla
            if (item.getProduct().getSeller().getId().equals(seller.getId())) {
                double itemTotal = item.getPrice().doubleValue() * item.getQuantity();
                totalRevenue += itemTotal;
                
                // Sipariş durumlarını say
                Order order = item.getOrder();
                if (order.getStatus() == OrderStatus.DELIVERED) {
                    completedOrders++;
                } else if (order.getStatus() == OrderStatus.CANCELLED) {
                    cancelledOrders++;
                } else {
                    pendingOrders++;
                }
            }
        }
        
        // En çok satan ürünleri hesapla
        Map<Long, SellerAnalyticsDto.TopProductDto> topProducts = new HashMap<>();
        for (OrderItem item : orderItems) {
            Product product = item.getProduct();
            if (product.getSeller().getId().equals(seller.getId())) {
                Long productId = product.getId();
                if (!topProducts.containsKey(productId)) {
                    SellerAnalyticsDto.TopProductDto topProductDto = new SellerAnalyticsDto.TopProductDto();
                    topProductDto.setId(productId);
                    topProductDto.setName(product.getName());
                    topProductDto.setQuantitySold(0);
                    topProductDto.setRevenue(0.0);
                    topProducts.put(productId, topProductDto);
                }
                
                SellerAnalyticsDto.TopProductDto existingProduct = topProducts.get(productId);
                existingProduct.setQuantitySold(existingProduct.getQuantitySold() + item.getQuantity());
                existingProduct.setRevenue(existingProduct.getRevenue() + (item.getPrice().doubleValue() * item.getQuantity()));
            }
        }
        
        // Satışların zaman içindeki dağılımını hesapla
        Map<String, Double> salesOverTime = new HashMap<>();
        for (OrderItem item : orderItems) {
            if (item.getProduct().getSeller().getId().equals(seller.getId())) {
                LocalDate orderDate = item.getOrder().getOrderDate().toLocalDate();
                String dateKey = orderDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
                
                double itemTotal = item.getPrice().doubleValue() * item.getQuantity();
                salesOverTime.put(dateKey, salesOverTime.getOrDefault(dateKey, 0.0) + itemTotal);
            }
        }
        
        // Kategori bazında satışları hesapla
        Map<String, Double> salesByCategory = new HashMap<>();
        for (OrderItem item : orderItems) {
            if (item.getProduct().getSeller().getId().equals(seller.getId())) {
                String categoryName = item.getProduct().getCategory().getName();
                double itemTotal = item.getPrice().doubleValue() * item.getQuantity();
                salesByCategory.put(categoryName, salesByCategory.getOrDefault(categoryName, 0.0) + itemTotal);
            }
        }
        
        // Son siparişleri getir (en fazla 5 tane)
        List<SellerAnalyticsDto.RecentOrderDto> recentOrders = new ArrayList<>();
        List<Order> sortedOrders = orders.stream()
                .sorted((o1, o2) -> o2.getOrderDate().compareTo(o1.getOrderDate()))
                .limit(5)
                .collect(Collectors.toList());
        
        for (Order order : sortedOrders) {
            double orderTotal = order.getOrderItems().stream()
                    .filter(item -> item.getProduct().getSeller().getId().equals(seller.getId()))
                    .mapToDouble(item -> item.getPrice().doubleValue() * item.getQuantity())
                    .sum();
            
            if (orderTotal > 0) { // Satıcıya ait ürün varsa
                SellerAnalyticsDto.RecentOrderDto recentOrderDto = new SellerAnalyticsDto.RecentOrderDto();
                recentOrderDto.setOrderId(order.getId());
                recentOrderDto.setCustomerName(order.getUser().getFirstName() + " " + order.getUser().getLastName());
                recentOrderDto.setOrderDate(order.getOrderDate().toString());
                recentOrderDto.setStatus(order.getStatus().toString());
                recentOrderDto.setTotal(orderTotal);
                
                recentOrders.add(recentOrderDto);
            }
        }
        
        // İade istatistiklerini hesapla
        // ReturnService'den satıcının iadelerini getir
        List<Return> sellerReturns = returnService.getReturnsBySeller(seller);
        int totalReturns = sellerReturns.size();
        double returnsRate = totalReturns > 0 ? (double) totalReturns / orderItems.size() * 100 : 0;
        
        // DTO'yu doldur
        analyticsDto.setTotalRevenue(totalRevenue);
        analyticsDto.setTotalOrders(orders.size());
        analyticsDto.setTotalProducts(products.size());
        analyticsDto.setAverageOrderValue(orders.isEmpty() ? 0 : totalRevenue / orders.size());
        analyticsDto.setPendingOrdersCount(pendingOrders);
        analyticsDto.setCancelledOrdersCount(cancelledOrders);
        analyticsDto.setCompletedOrdersCount(completedOrders);
        analyticsDto.setTopSellingProducts(new ArrayList<>(topProducts.values()));
        analyticsDto.setSalesOverTime(salesOverTime);
        analyticsDto.setSalesByCategory(salesByCategory);
        analyticsDto.setRecentOrders(recentOrders);
        analyticsDto.setTotalReturns(totalReturns);
        analyticsDto.setReturnsRate(returnsRate);
        
        return analyticsDto;
    }
} 
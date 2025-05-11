package com.webapp.backend.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerAnalyticsDto {
    // Özet istatistikler
    private Double totalRevenue;
    private Integer totalOrders;
    private Integer totalProducts;
    private Double averageOrderValue;
    private Integer pendingOrdersCount;
    private Integer cancelledOrdersCount;
    private Integer completedOrdersCount;
    
    // En çok satılan ürünler
    private List<TopProductDto> topSellingProducts;
    
    // Satış istatistikleri - aylık veya günlük
    private Map<String, Double> salesOverTime;
    
    // Kategori bazında satışlar
    private Map<String, Double> salesByCategory;
    
    // En son siparişler
    private List<RecentOrderDto> recentOrders;
    
    // İade/ürün dönüş istatistikleri
    private Integer totalReturns;
    private Double returnsRate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductDto {
        private Long id;
        private String name;
        private Integer quantitySold;
        private Double revenue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrderDto {
        private Long orderId;
        private String customerName;
        private String orderDate;
        private String status;
        private Double total;
    }
} 
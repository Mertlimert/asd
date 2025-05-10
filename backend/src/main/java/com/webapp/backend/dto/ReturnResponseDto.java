package com.webapp.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.webapp.backend.model.RefundStatus;
import com.webapp.backend.model.ReturnCondition;
import com.webapp.backend.model.ReturnReason;
import com.webapp.backend.model.ReturnStatus;

import lombok.Data;

@Data
public class ReturnResponseDto {
    private Long id;
    private Long orderId;
    private LocalDateTime returnDate;
    private ReturnStatus status;
    private String reasonForReturn;
    private BigDecimal refundAmount;
    private RefundStatus refundStatus;
    private List<ReturnItemResponse> items;
    
    @Data
    public static class ReturnItemResponse {
        private Long id;
        private Long orderItemId;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private ReturnReason returnReason;
        private ReturnCondition returnCondition;
        private String additionalComments;
    }
} 
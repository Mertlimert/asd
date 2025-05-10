package com.webapp.backend.dto;

import java.util.List;
import java.util.stream.Collectors;

import com.webapp.backend.model.Category;
import com.webapp.backend.model.Product;

public class CategoryDto {
    private Long id;
    private String name;
    private String description;
    private List<ProductSummaryDto> products;

    public CategoryDto() {
    }

    public CategoryDto(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.description = category.getDescription();
        
        if (category.getProducts() != null) {
            this.products = category.getProducts().stream()
                .map(ProductSummaryDto::new)
                .collect(Collectors.toList());
        }
    }

    // DTO for simplified product information
    public static class ProductSummaryDto {
        private Long id;
        private String name;
        private String description;
        private Double price;
        private String image_url;
        private int stockQuantity;
        private Long category_id;
        private UserSummaryDto seller;

        public ProductSummaryDto() {
        }

        public ProductSummaryDto(Product product) {
            this.id = product.getId();
            this.name = product.getName();
            this.description = product.getDescription();
            this.price = product.getPrice();
            this.image_url = product.getImage_url();
            this.stockQuantity = product.getStockQuantity();
            this.category_id = product.getCategory_id();
            
            if (product.getSeller() != null) {
                this.seller = new UserSummaryDto(
                    product.getSeller().getId(),
                    product.getSeller().getUsername(),
                    product.getSeller().getEmail(),
                    product.getSeller().getFirstName(),
                    product.getSeller().getLastName()
                );
            }
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Double getPrice() {
            return price;
        }

        public void setPrice(Double price) {
            this.price = price;
        }

        public String getImage_url() {
            return image_url;
        }

        public void setImage_url(String image_url) {
            this.image_url = image_url;
        }

        public int getStockQuantity() {
            return stockQuantity;
        }

        public void setStockQuantity(int stockQuantity) {
            this.stockQuantity = stockQuantity;
        }

        public Long getCategory_id() {
            return category_id;
        }

        public void setCategory_id(Long category_id) {
            this.category_id = category_id;
        }

        public UserSummaryDto getSeller() {
            return seller;
        }

        public void setSeller(UserSummaryDto seller) {
            this.seller = seller;
        }
    }

    // Basic user information
    public static class UserSummaryDto {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;

        public UserSummaryDto() {
        }

        public UserSummaryDto(Long id, String username, String email, String firstName, String lastName) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }
    }

    // Getters and setters for CategoryDto
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ProductSummaryDto> getProducts() {
        return products;
    }

    public void setProducts(List<ProductSummaryDto> products) {
        this.products = products;
    }
} 
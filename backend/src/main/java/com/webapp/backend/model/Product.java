package com.webapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private Double price;

    private String image_url;

    private int stockQuantity;

    @ManyToOne
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"products", "category", "seller"})
    private Category category;

    // Add seller relationship
    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false) // Assuming a product must have a seller
    @JsonIgnoreProperties({"password", "cart", "token", "banned", "role", "addresses", "products"}) // Avoid exposing sensitive seller details
    private User seller;

    @Transient
    private Long category_id;

    public Long getCategory_id() {
        return category != null ? category.getId() : category_id;
    }

    public void setCategory_id(Long category_id) {
        this.category_id = category_id;
    }

    // Getters and Setters
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

    public Integer getStock_quantity() {
        return stockQuantity;
    }

    public void setStock_quantity(Integer stock_quantity) {
        this.stockQuantity = stock_quantity;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    // Getter and Setter for seller
    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }
}
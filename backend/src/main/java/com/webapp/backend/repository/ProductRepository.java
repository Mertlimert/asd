package com.webapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.backend.model.Category;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findBySeller(User seller);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByPriceBetween(Double minPrice, Double maxPrice);
    List<Product> findByStockQuantityGreaterThan(Integer minStock);
}
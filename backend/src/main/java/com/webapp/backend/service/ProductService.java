package com.webapp.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.webapp.backend.model.Category;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;
import com.webapp.backend.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> findByCategory(Category category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> findBySeller(User seller) {
        return productRepository.findBySeller(seller);
    }

    public List<Product> findByNameContainingIgnoreCase(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Product> findByPriceBetween(Double minPrice, Double maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }

    public List<Product> findByStockQuantityGreaterThan(Integer minStock) {
        return productRepository.findByStockQuantityGreaterThan(minStock);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    public Product updateProduct(Product product) {
        return productRepository.save(product);
    }
}
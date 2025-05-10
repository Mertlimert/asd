package com.webapp.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.CategoryDto;
import com.webapp.backend.exception.DuplicateResourceException;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.model.Category;
import com.webapp.backend.service.CategoryService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<Category> categories = categoryService.findAllCategories();
        List<CategoryDto> categoryDtos = categories.stream()
            .map(CategoryDto::new)
            .collect(Collectors.toList());
        return ResponseEntity.ok(categoryDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        CategoryDto categoryDto = new CategoryDto(category);
        return ResponseEntity.ok(categoryDto);
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        // Kategori adı kontrolü
        if (categoryService.existsByName(category.getName())) {
            throw new DuplicateResourceException("Category", "name", category.getName());
        }

        Category savedCategory = categoryService.saveCategory(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category categoryDetails) {
        Category existingCategory = categoryService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        // Kategori bilgilerini güncelle
        // Eğer yeni ad başka bir kategoride kullanılıyorsa ve bu kategori değilse hata döndür
        if (!existingCategory.getName().equals(categoryDetails.getName()) && 
            categoryService.existsByName(categoryDetails.getName())) {
            throw new DuplicateResourceException("Category", "name", categoryDetails.getName());
        }
        
        existingCategory.setName(categoryDetails.getName());
        existingCategory.setDescription(categoryDetails.getDescription());
        
        Category updatedCategory = categoryService.updateCategory(existingCategory);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteCategory(@PathVariable Long id) {
        Category category = categoryService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        categoryService.deleteCategory(id);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        
        return ResponseEntity.ok(response);
    }
}
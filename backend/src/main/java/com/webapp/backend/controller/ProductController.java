package com.webapp.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.webapp.backend.dto.ProductRequestDto;
import com.webapp.backend.dto.ProductResponseDto;
import com.webapp.backend.exception.ResourceNotFoundException;
import com.webapp.backend.exception.BadRequestException;
import com.webapp.backend.model.Category;
import com.webapp.backend.model.Product;
import com.webapp.backend.model.User;
import com.webapp.backend.service.CategoryService;
import com.webapp.backend.service.ProductService;
import com.webapp.backend.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final UserService userService;

    @Autowired
    public ProductController(ProductService productService, CategoryService categoryService, UserService userService) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> getAllProducts() {
        List<Product> products = productService.findAllProducts();
        List<ProductResponseDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        Product product = productService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        ProductResponseDto productDto = convertToDto(product);
        return ResponseEntity.ok(productDto);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponseDto>> getProductsByCategory(@PathVariable Long categoryId) {
        Category category = categoryService.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
                
        List<Product> products = productService.findByCategory(category);
        List<ProductResponseDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponseDto>> searchProducts(@RequestParam String name) {
        List<Product> products = productService.findByNameContainingIgnoreCase(name);
        List<ProductResponseDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/price")
    public ResponseEntity<List<ProductResponseDto>> getProductsByPriceRange(
            @RequestParam(required = false) Double min,
            @RequestParam(required = false) Double max) {
        Double minPrice = min != null ? min : 0.0;
        Double maxPrice = max != null ? max : Double.MAX_VALUE;
        List<Product> products = productService.findByPriceBetween(minPrice, maxPrice);
        List<ProductResponseDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ProductResponseDto>> getProductsBySeller(@PathVariable Long sellerId) {
        User seller = userService.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));
                
        List<Product> products = productService.findBySeller(seller);
        List<ProductResponseDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @PostMapping
    public ResponseEntity<ProductResponseDto> createProduct(@Valid @RequestBody ProductRequestDto productDto) {
        try {
            // Debug için istek içeriğini logla
            System.out.println("Gelen istek içeriği: " + productDto);
            
            if (productDto.getSeller_id() == null) {
                throw new BadRequestException("Required parameter 'sellerId' is not present.");
            }
            
            // Kategori kontrolü
            Category category = categoryService.findById(productDto.getCategory_id())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productDto.getCategory_id()));
    
            // Satıcı kontrolü
            User seller = userService.findById(productDto.getSeller_id())
                    .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", productDto.getSeller_id()));
    
            // DTO'dan entity'ye dönüştür
            Product product = new Product();
            product.setName(productDto.getName());
            product.setDescription(productDto.getDescription());
            product.setPrice(productDto.getPrice());
            product.setImage_url(productDto.getImage_url());
            product.setStock_quantity(productDto.getStock_quantity());
            product.setCategory(category);
            product.setSeller(seller);
    
            Product savedProduct = productService.saveProduct(product);
            ProductResponseDto responseDto = convertToDto(savedProduct);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            // Hata detayını logla
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDto> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequestDto productDto) {
        Product existingProduct = productService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        
        // Ürün bilgilerini güncelle
        existingProduct.setName(productDto.getName());
        existingProduct.setDescription(productDto.getDescription());
        existingProduct.setPrice(productDto.getPrice());
        existingProduct.setImage_url(productDto.getImage_url());
        existingProduct.setStock_quantity(productDto.getStock_quantity());
        
        // Kategori güncelleme
        if (productDto.getCategory_id() != null) {
            Category category = categoryService.findById(productDto.getCategory_id())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productDto.getCategory_id()));
            existingProduct.setCategory(category);
        }
        
        Product updatedProduct = productService.updateProduct(existingProduct);
        ProductResponseDto responseDto = convertToDto(updatedProduct);
        
        return ResponseEntity.ok(responseDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteProduct(@PathVariable Long id) {
        Product product = productService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        
        productService.deleteProduct(id);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Product entity'sini ProductResponseDto'ya dönüştürür
     */
    private ProductResponseDto convertToDto(Product product) {
        ProductResponseDto dto = new ProductResponseDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setImage_url(product.getImage_url());
        dto.setStock_quantity(product.getStock_quantity());
        
        // Kategori bilgileri
        if (product.getCategory() != null) {
            ProductResponseDto.CategoryDto categoryDto = new ProductResponseDto.CategoryDto(
                product.getCategory().getId(),
                product.getCategory().getName()
            );
            dto.setCategory(categoryDto);
        }
        
        // Satıcı bilgileri
        if (product.getSeller() != null) {
            ProductResponseDto.SellerDto sellerDto = new ProductResponseDto.SellerDto(
                product.getSeller().getId(),
                product.getSeller().getUsername()
            );
            dto.setSeller(sellerDto);
        }
        
        return dto;
    }
}
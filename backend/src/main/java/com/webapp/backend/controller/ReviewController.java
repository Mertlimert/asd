package com.webapp.backend.controller;

import com.webapp.backend.model.Review;
import com.webapp.backend.service.ReviewService;
import com.webapp.backend.service.UserService;
import com.webapp.backend.dto.ReviewRequestDto;
import com.webapp.backend.dto.ReviewResponseDto;
import com.webapp.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @Autowired
    public ReviewController(ReviewService reviewService, UserService userService) {
        this.reviewService = reviewService;
        this.userService = userService;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsByProductId(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        List<ReviewResponseDto> reviewDtos = reviews.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviewDtos);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ReviewResponseDto> createReview(@RequestBody ReviewRequestDto reviewDto) {
        Review review = convertToEntity(reviewDto);
        Review savedReview = reviewService.saveReview(review);
        return new ResponseEntity<>(convertToResponseDto(savedReview), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ReviewResponseDto> updateReview(
            @PathVariable Long id,
            @RequestBody ReviewRequestDto reviewDto) {
        
        Review existingReview = reviewService.getReviewById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        
        // Ensure only the owner or admin can update it
        if (!reviewService.canUserModifyReview(existingReview)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Review updatedReview = convertToEntity(reviewDto);
        updatedReview.setId(id);
        updatedReview = reviewService.saveReview(updatedReview);
        
        return ResponseEntity.ok(convertToResponseDto(updatedReview));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        Review review = reviewService.getReviewById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        
        // Ensure only the owner or admin can delete it
        if (!reviewService.canUserModifyReview(review)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    private Review convertToEntity(ReviewRequestDto dto) {
        Review review = new Review();
        review.setId(dto.getId());
        review.setProductId(dto.getProductId());
        review.setUserId(dto.getUserId());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        return review;
    }

    private ReviewResponseDto convertToResponseDto(Review review) {
        ReviewResponseDto dto = new ReviewResponseDto();
        dto.setId(review.getId());
        dto.setProductId(review.getProductId());
        dto.setUserId(review.getUserId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        
        // Add user details to help with display
        try {
            var user = userService.getUserById(review.getUserId());
            if (user != null) {
                dto.setUser(new ReviewResponseDto.UserInfo(
                    user.getId(),
                    user.getUsername(),
                    user.getFirstName(),
                    user.getLastName()
                ));
            }
        } catch (Exception e) {
            // Do nothing, user info is optional
        }
        
        return dto;
    }
} 
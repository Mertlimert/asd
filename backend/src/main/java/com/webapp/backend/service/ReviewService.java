package com.webapp.backend.service;

import com.webapp.backend.model.Review;
import com.webapp.backend.repository.ReviewRepository;
import com.webapp.backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SecurityUtils securityUtils;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository, SecurityUtils securityUtils) {
        this.reviewRepository = reviewRepository;
        this.securityUtils = securityUtils;
    }

    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductId(productId);
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public Review saveReview(Review review) {
        return reviewRepository.save(review);
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }
    
    public boolean canUserModifyReview(Review review) {
        // Check if the current user is the owner of the review or an admin
        Long currentUserId = securityUtils.getCurrentUserId();
        boolean isAdmin = securityUtils.isCurrentUserAdmin();
        
        return isAdmin || (currentUserId != null && currentUserId.equals(review.getUserId()));
    }
} 
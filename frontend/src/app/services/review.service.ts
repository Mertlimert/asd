import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Review } from '../models/review.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:8080/api/reviews';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Get all reviews for a product
  getProductReviews(productId: number): Observable<Review[]> {
    const url = `${this.apiUrl}/product/${productId}`;
    console.log(`Fetching reviews from: ${url}`);

    return this.http.get<Review[]>(url)
      .pipe(
        catchError(error => {
          console.error(`Error fetching reviews from ${url}:`, error);
          // Log specific details if available
          if (error.error) {
            console.error('Backend error details:', error.error);
          }
          // Return empty array to prevent breaking the UI, but log the failure
          console.warn('Failed to fetch reviews. Returning empty array as fallback.');
          return [];
        })
      );
  }

  // Add a new review
  addReview(review: Review): Observable<Review> {
    // Make sure the current user ID is included
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if we have a valid auth token
    const authToken = this.authService.getAuthToken();
    if (!authToken) {
      console.error('Missing authentication token');
      return throwError(() => new Error('Authentication token is missing. Please log in again.'));
    }

    // Add user ID to the review data
    const reviewData = {
      ...review,
      userId: currentUserId
    };

    console.log('Sending review data:', reviewData);
    console.log('User authenticated, token exists:', !!authToken);

    // Use Angular's built-in HTTP interceptor instead of manual headers
    return this.http.post<Review>(this.apiUrl, reviewData).pipe(
      catchError(error => {
        console.error('Review submission failed with status:', error.status);
        console.error('Error details:', error);
        return this.handleError(error);
      })
    );
  }

  // Update an existing review
  updateReview(review: Review): Observable<Review> {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if we have a valid auth token
    const authToken = this.authService.getAuthToken();
    if (!authToken) {
      console.error('Missing authentication token');
      return throwError(() => new Error('Authentication token is missing. Please log in again.'));
    }

    // Let the interceptor handle the Authorization header
    return this.http.put<Review>(`${this.apiUrl}/${review.id}`, review).pipe(
      catchError(error => {
        console.error('Review update failed with status:', error.status);
        console.error('Error details:', error);
        return this.handleError(error);
      })
    );
  }

  // Delete a review
  deleteReview(reviewId: number): Observable<void> {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if we have a valid auth token
    const authToken = this.authService.getAuthToken();
    if (!authToken) {
      console.error('Missing authentication token');
      return throwError(() => new Error('Authentication token is missing. Please log in again.'));
    }

    // Add query parameters to indicate who is performing the deletion
    const params = new HttpParams()
      .set('userId', currentUserId.toString())
      .set('isAdmin', this.authService.isAdmin().toString());

    console.log('Attempting to delete review:', reviewId);
    console.log('Current user ID:', currentUserId);
    console.log('Is admin:', this.authService.isAdmin());

    // Include query parameters in the delete request
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`, { params }).pipe(
      catchError(error => {
        console.error('Review deletion failed with status:', error.status);
        console.error('Error details:', error);
        return this.handleError(error);
      })
    );
  }

  // Error handling
  private handleError(error: any): Observable<never> {
    console.error('Review service error:', error);
    let errorMessage = 'Something went wrong with the review operation';

    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}

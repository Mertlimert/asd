import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `http://localhost:8080/api`;

  private mockProducts: Product[] = [
    {
      id: 1,
      name: 'Mock Product 1',
      description: 'This is a mock product description.',
      price: 19.99,
      image_url: 'https://via.placeholder.com/150',
      stock_quantity: 100,
      category_id: 1
    },
    {
      id: 2,
      name: 'Mock Product 2',
      description: 'This is another mock product description.',
      price: 29.99,
      image_url: 'https://via.placeholder.com/150',
      stock_quantity: 50,
      category_id: 2
    }
  ];
  constructor(
    private http: HttpClient,
    private authService: AuthService // Inject AuthService
  ) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError(error => {
        console.error('Error fetching products from API:', error);
        return of(this.mockProducts);
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching product with id ${id}:`, error);
        const product = this.mockProducts.find(p => p.id === id);
        return product ? of(product) : throwError(() => new Error('Product not found'));
      })
    );
  }

  // Get products owned by the current seller
  getSellerProducts(): Observable<Product[]> {
    const sellerId = this.authService.getCurrentUserId();
    if (!sellerId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Use a dedicated endpoint for seller products or use query parameter
    return this.http.get<Product[]>(`${this.apiUrl}/products/seller`).pipe(
      catchError(error => {
        console.error('Error fetching seller products:', error);
        // If API fails, fallback to filtering (less reliable)
        return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
          map(products => products.filter(product => product.seller?.id === sellerId)),
          catchError(this.handleError)
        );
      })
    );
  }

  createProduct(product: Product): Observable<Product> {
    // Kullanıcıdan satıcı ID'sini al
    const sellerId = this.authService.getCurrentUserId();
    if (!sellerId) {
      return throwError(() => new Error('Kullanıcı kimliği bulunamadı. Lütfen giriş yapın.'));
    }

    // Make a copy of the product data to prevent issues with mutating the original
    const productData = {
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image_url: product.image_url || '',
      stock_quantity: Number(product.stock_quantity),
      // Ensure category_id is properly converted to a number or passed as null
      category_id: product.category_id !== undefined && product.category_id !== null
        ? Number(product.category_id)
        : null,
      // Satıcı ID'sini ekliyoruz
      seller_id: sellerId
    };

    console.log('Sending product data to server:', productData);

    return this.http.post<Product>(`${this.apiUrl}/products`, productData).pipe(
      catchError((error) => {
        console.error('Error creating product:', error);
        return this.handleError(error);
      })
    );
  }

  updateProduct(product: Product): Observable<Product> {
    // Kullanıcıdan satıcı ID'sini al
    const sellerId = this.authService.getCurrentUserId();
    if (!sellerId) {
      return throwError(() => new Error('Kullanıcı kimliği bulunamadı. Lütfen giriş yapın.'));
    }

    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image_url: product.image_url,
      stock_quantity: Number(product.stock_quantity),
      category_id: product.category_id !== undefined ? Number(product.category_id) : null,
      seller_id: sellerId // Satıcı ID'sini ekliyoruz
    };

    return this.http.put<Product>(`${this.apiUrl}/products/${product.id}`, productData).pipe(
      catchError(this.handleError)
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${categoryId}`);
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/search`, {
      params: { query }
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('Product service error:', error);
    let errorMessage = 'Something went wrong';

    if (error.error) {
      // Handle Spring Boot style errors
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}

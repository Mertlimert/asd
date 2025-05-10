import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError, of } from 'rxjs';
import { CartItem, Cart } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8080/api/cart';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    // Only load cart if user is logged in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCart();
      } else {
        // Clear cart when user logs out
        this.cartItems = [];
        this.cartSubject.next([]);
      }
    });
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  isLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  loadCart(): void {
    // Skip loading if not authenticated
    if (!this.authService.isLoggedIn()) {
      console.log('User not logged in, skipping cart load');
      return;
    }

    // Kullanıcı ID'sini al
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    this.loadingSubject.next(true);

    // URL'e kullanıcı ID'sini ekle
    this.http.get<Cart>(`${this.apiUrl}/${userId}`).pipe(
      catchError(error => {
        console.error('Error loading cart:', error);
        this.handleAuthError(error);
        // Hata durumunda boş sepet döndür
        return of({ id: 0, userId: userId, items: [], totalPrice: 0 } as Cart);
      })
    ).subscribe({
      next: (cart) => {
        console.log('Cart loaded:', cart);
        // API yanıtında items alanı var
        this.cartItems = cart.items || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
      }
    });
  }

  // Ürünün sepette olup olmadığını ve mevcut miktarını kontrol et
  private getCartItemQuantity(productId: number): number {
    const existingItem = this.cartItems.find(item => item.product.id === productId);
    return existingItem ? existingItem.quantity : 0;
  }

  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    // Validate authentication first
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return throwError(() => new Error('Ürün eklemek için giriş yapmalısınız'));
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    // Stok kontrolü yap
    const currentQuantityInCart = this.getCartItemQuantity(product.id!);
    const newTotalQuantity = currentQuantityInCart + quantity;

    if (newTotalQuantity > product.stock_quantity) {
      return throwError(() => new Error(`Yetersiz stok: Bu üründen en fazla ${product.stock_quantity} adet ekleyebilirsiniz. Sepetinizde zaten ${currentQuantityInCart} adet bulunuyor.`));
    }

    this.loadingSubject.next(true);
    console.log(`Adding product to cart: POST ${this.apiUrl}/${userId}/product/${product.id}?quantity=${quantity}`);

    return this.http.post<Cart>(`${this.apiUrl}/${userId}/product/${product.id}?quantity=${quantity}`, {}).pipe(
      tap(cart => {
        console.log('Cart updated:', cart);
        this.cartItems = cart.items || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error adding to cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error(error.error?.detail || error.error?.message || 'Ürün sepete eklenemedi. Lütfen tekrar deneyin.'));
      })
    );
  }

  updateQuantity(productId: number, quantity: number): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    // Önce ürün bilgisini bulmaya çalış
    const existingItem = this.cartItems.find(item => item.product.id === productId);
    if (existingItem && existingItem.product) {
      // Stok kontrolü yap
      if (quantity > existingItem.product.stock_quantity) {
        return throwError(() => new Error(`Stok sınırı aşıldı: Bu üründen en fazla ${existingItem.product.stock_quantity} adet ekleyebilirsiniz.`));
      }
    }

    this.loadingSubject.next(true);
    return this.http.put<Cart>(`${this.apiUrl}/${userId}/product/${productId}?quantity=${quantity}`, {}).pipe(
      tap(cart => {
        this.cartItems = cart.items || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error updating quantity:', error);
        this.handleAuthError(error);

        // Hata mesajını ilet
        return throwError(() => new Error(error.error?.detail || error.error?.message || 'Miktar güncellenemedi. Stok sınırını aşmış olabilirsiniz.'));
      })
    );
  }

  removeFromCart(productId: number): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    this.loadingSubject.next(true);
    return this.http.delete<Cart>(`${this.apiUrl}/${userId}/product/${productId}`).pipe(
      tap(cart => {
        this.cartItems = cart.items || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error removing from cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error('Ürün sepetten çıkarılamadı. Lütfen tekrar deneyin.'));
      })
    );
  }

  clearCart(): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    this.loadingSubject.next(true);
    return this.http.delete<Cart>(`${this.apiUrl}/${userId}/clear`).pipe(
      tap(cart => {
        this.cartItems = [];
        this.cartSubject.next([]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error clearing cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error('Sepet temizlenemedi. Lütfen tekrar deneyin.'));
      })
    );
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => {
      // subtotal undefined olabilir, güvenli erişim
      const subtotal = item.subtotal || 0;
      const price = item.product?.price || (item.quantity > 0 ? subtotal / item.quantity : 0);
      return total + (price * item.quantity);
    }, 0);
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }

  // Helper method to handle authentication errors
  private handleAuthError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      console.log('Authentication error, redirecting to login');
      this.authService.logout(); // Clear current auth state
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }
}

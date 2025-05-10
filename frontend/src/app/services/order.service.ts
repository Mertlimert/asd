import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface OrderRequest {
  shippingAddressId: number;
  billingAddressId?: number;
  paymentMethod: string;
  couponCode?: string;
  paymentMethodId?: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
  sellerId?: number;
  status?: string;
}

export interface OrderResponse {
  id: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  orderNumber: string;
  totalPrice: number;
  totalAmount: number;
  shippingPrice: number;
  discountAmount?: number;
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  orderDate?: string;
  items: OrderItem[];
  shippingAddress: any;
  billingAddress?: any;
  couponCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/api/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  createOrder(orderRequest?: OrderRequest): Observable<OrderResponse> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    // Eğer orderRequest parametresi verilmediyse sepetteki ürünlerden sipariş oluştur (basit ödeme için)
    if (!orderRequest) {
      console.log('Sepetten otomatik sipariş oluşturuluyor...');
      return this.http.post<OrderResponse>(`${this.apiUrl}/checkout-from-cart`, {})
        .pipe(catchError(this.handleError));
    }

    // Normal sipariş oluşturma işlemi
    return this.http.post<OrderResponse>(`${this.apiUrl}/${userId}`, orderRequest)
      .pipe(catchError(this.handleError));
  }

  getUserOrders(): Observable<OrderResponse[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<OrderResponse[]>(`${this.apiUrl}/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<OrderResponse>(`${this.apiUrl}/${userId}/order/${orderId}`)
      .pipe(catchError(this.handleError));
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.put<OrderResponse>(`${this.apiUrl}/${userId}/order/${orderId}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  getOrderStatuses(): string[] {
    return [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED'
    ];
  }

  getPaymentStatuses(): string[] {
    return [
      'PENDING',
      'PAID',
      'REFUNDED',
      'FAILED'
    ];
  }

  getPaymentMethods(): string[] {
    return [
      'CREDIT_CARD',
      'CASH_ON_DELIVERY',
      'BANK_TRANSFER'
    ];
  }

  /**
   * Satıcının siparişlerini getir
   */
  getSellerOrders(): Observable<OrderResponse[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<OrderResponse[]>(`${this.apiUrl}/seller/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin için tüm siparişleri getir
   */
  getAllOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/all`)
      .pipe(
        map(orders => orders.map(order => ({
          ...order,
          // Backend ve frontend model uyumsuzluğunu gider
          // orderDate varsa kullan, yoksa createdAt'i kullan
          orderDate: order.orderDate || order.createdAt
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Sipariş durumunu güncelle (Admin için)
   */
  updateOrderStatus(orderId: number, newStatus: string): Observable<OrderResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Strateji değiştiriyoruz: Tüm durum değerlerini sade string olarak gönderelim
    return this.http.put<OrderResponse>(
      `${this.apiUrl}/${orderId}/status`,
      `"${newStatus}"`,  // PENDING -> "PENDING" şeklinde sade string
      { headers }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Ödeme durumunu güncelle (Admin için)
   */
  updatePaymentStatus(orderId: number, newStatus: string): Observable<OrderResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Strateji değiştiriyoruz: Tüm durum değerlerini sade string olarak gönderelim
    return this.http.put<OrderResponse>(
      `${this.apiUrl}/${orderId}/payment`,
      `"${newStatus}"`,  // PAID -> "PAID" şeklinde sade string
      { headers }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Satıcı olarak bir siparişin durumunu güncelle
   * Satıcı sadece kendi ürünlerini içeren siparişleri güncelleyebilir
   */
  updateOrderStatusBySeller(orderId: number, newStatus: string): Observable<OrderResponse> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<OrderResponse>(
      `${this.apiUrl}/seller/${userId}/order/${orderId}/status`,
      `"${newStatus}"`,
      { headers }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Satıcı olarak bir siparişte bulunan kendi ürünlerinin durumunu güncelle
   */
  updateSellerOrderItemsStatus(orderId: number, newStatus: string): Observable<OrderResponse> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // JSON nesnesi olarak gönder, string olarak değil
    return this.http.put<OrderResponse>(
      `${this.apiUrl}/seller/${userId}/order/${orderId}/items/status`,
      { status: newStatus },
      { headers }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Admin olarak belirli bir sipariş öğesinin durumunu güncelle
   */
  updateOrderItemStatus(orderItemId: number, newStatus: string): Observable<OrderResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<OrderResponse>(
      `${this.apiUrl}/admin/order-item/${orderItemId}/status`,
      `"${newStatus}"`,
      { headers }
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Bir hata oluştu';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.error?.detail || `Hata kodu: ${error.status}, Mesaj: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}

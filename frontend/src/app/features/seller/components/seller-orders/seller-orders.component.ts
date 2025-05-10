import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderResponse, OrderItem } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="seller-orders">
      <div class="content-header">
        <h2>Siparişler</h2>
      </div>

      <div class="orders-container">
        <div *ngIf="loading" class="loading-indicator">
          <p>Siparişler yükleniyor...</p>
        </div>

        <div *ngIf="!loading && error" class="error-message">
          <p>{{ error }}</p>
        </div>

        <div *ngIf="!loading && !error && orders.length === 0" class="empty-state">
          <p>Henüz hiç sipariş bulunmamaktadır.</p>
        </div>

        <table *ngIf="!loading && !error && orders.length > 0" class="orders-table">
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Tarih</th>
              <th>Ürünler</th>
              <th>Müşteri</th>
              <th>Toplam</th>
              <th>Sipariş Durumu</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders">
              <td>{{ order.orderNumber || order.id }}</td>
              <td>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div *ngFor="let item of order.items" class="order-item">
                  <span *ngIf="isSellerProduct(item)">{{ item.productName }} (x{{ item.quantity }})</span>
                  <span *ngIf="!isSellerProduct(item)" class="other-seller-product">[Diğer satıcı ürünü]</span>
                </div>
              </td>
              <td>{{ getUserInfo(order) }}</td>
              <td>{{ getSellerSubtotal(order) | currency:'₺' }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                  {{ order.status }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn-details" (click)="showOrderDetails(order)">
                    <i class="bi bi-eye-fill"></i> Detaylar
                  </button>
                  <button class="btn-update" (click)="openUpdateStatus(order)">
                    <i class="bi bi-pencil-fill"></i> Durum
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sipariş Detay Modal -->
    <div *ngIf="selectedOrder" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Sipariş #{{ selectedOrder.orderNumber || selectedOrder.id }} Detayları</h3>
          <button class="btn-close" (click)="selectedOrder = null">&times;</button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h4>Müşteri Bilgileri</h4>
            <p *ngIf="selectedOrder.userFirstName && selectedOrder.userLastName">
              <strong>Ad Soyad:</strong> {{ selectedOrder.userFirstName }} {{ selectedOrder.userLastName }}
            </p>
            <p *ngIf="selectedOrder.userId">
              <strong>Müşteri ID:</strong> {{ selectedOrder.userId }}
            </p>
          </div>

          <div class="detail-section">
            <h4>Teslimat Adresi</h4>
            <div *ngIf="selectedOrder.shippingAddress">
              <p><strong>Alıcı:</strong> {{ selectedOrder.shippingAddress.recipientName }}</p>
              <p><strong>Adres:</strong> {{ selectedOrder.shippingAddress.addressLine1 }}</p>
              <p *ngIf="selectedOrder.shippingAddress.addressLine2"><strong>Adres (devam):</strong> {{ selectedOrder.shippingAddress.addressLine2 }}</p>
              <p><strong>Şehir/Posta Kodu:</strong> {{ selectedOrder.shippingAddress.city }}, {{ selectedOrder.shippingAddress.postalCode }}</p>
              <p><strong>Ülke:</strong> {{ selectedOrder.shippingAddress.country }}</p>
              <p><strong>Telefon:</strong> {{ selectedOrder.shippingAddress.phoneNumber }}</p>
            </div>
            <p *ngIf="!selectedOrder.shippingAddress">Teslimat adresi bilgisi bulunmuyor.</p>
          </div>

          <div class="detail-section">
            <h4>Sipariş Özeti</h4>
            <p><strong>Sipariş Tarihi:</strong> {{ selectedOrder.createdAt | date:'dd MMMM yyyy, HH:mm' }}</p>
            <p><strong>Genel Durum:</strong> <span class="status-badge-sm" [ngClass]="getStatusClass(selectedOrder.status)">{{ selectedOrder.status }}</span></p>
            <p><strong>Ödeme Yöntemi:</strong> {{ selectedOrder.paymentMethod }}</p>
            <p><strong>Toplam Tutar (Sizin Ürünler):</strong> {{ getSellerSubtotal(selectedOrder) | currency:'₺' }}</p>
            <p><strong>Sipariş Genel Toplamı:</strong> {{ selectedOrder.totalAmount | currency:'₺' }}</p>
          </div>

          <div class="detail-section">
            <h4>Ürünler</h4>
            <div class="order-items-list">
              <!-- Satıcının kendi ürünleri -->
              <div *ngFor="let item of getSellerProducts(selectedOrder)" class="order-item-detail">
                <div class="item-image" *ngIf="item.productImage">
                  <img [src]="item.productImage" alt="{{ item.productName }}">
                </div>
                <div class="item-info">
                  <p class="item-name">{{ item.productName }}</p>
                  <p class="item-price">{{ item.price | currency:'₺' }} x {{ item.quantity }}</p>
                  <p class="item-subtotal"><strong>{{ item.subtotal | currency:'₺' }}</strong></p>
                  <p class="item-status">
                    <strong>Durum:</strong>
                    <span class="status-badge-sm" [ngClass]="getStatusClass(item.status || selectedOrder.status)">
                      {{ item.status || selectedOrder.status }}
                    </span>
                    <button class="btn-update-item-status" (click)="openUpdateItemStatus(selectedOrder, item)">
                      <i class="bi bi-pencil-fill"></i> Durumu Güncelle
                    </button>
                  </p>
                </div>
              </div>

              <!-- Diğer satıcıların ürünleri (sansürlü) -->
              <div *ngIf="getOtherSellerProductsCount(selectedOrder) > 0" class="order-item-other-sellers">
                <p>
                  Bu siparişte {{ getOtherSellerProductsCount(selectedOrder) }} adet diğer satıcılara ait ürün bulunmaktadır.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-close-modal" (click)="selectedOrder = null">Kapat</button>
        </div>
      </div>
    </div>

    <!-- Durum Güncelleme Modal -->
    <div class="modal-backdrop" *ngIf="showUpdateModal" (click)="closeModal($event)"></div>
    <div class="modal-container" *ngIf="showUpdateModal">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isItemUpdate ? 'Ürün Durumunu Güncelle' : 'Tüm Ürünlerin Durumunu Güncelle' }}</h3>
          <button class="btn-close" (click)="closeModal($event)">&times;</button>
        </div>
        <div class="modal-body" *ngIf="updatingOrder">
          <div *ngIf="updateError" class="alert-error">
            {{ updateError }}
          </div>

          <div *ngIf="isItemUpdate && updatingItem">
            <p><strong>Ürün:</strong> {{ updatingItem.productName }}</p>
            <p><strong>Miktar:</strong> {{ updatingItem.quantity }}</p>
            <p><strong>Mevcut Durum:</strong> <span class="status-badge-sm" [ngClass]="getStatusClass(updatingItem.status || updatingOrder.status)">{{ updatingItem.status || updatingOrder.status }}</span></p>
          </div>

          <div *ngIf="!isItemUpdate">
            <p><strong>Sipariş No:</strong> #{{ updatingOrder.orderNumber || updatingOrder.id }}</p>
            <p><strong>Mevcut Durum:</strong> <span class="status-badge-sm" [ngClass]="getStatusClass(updatingOrder.status)">{{ updatingOrder.status }}</span></p>
            <p><strong>Not:</strong> Bu işlem siparişteki <u>sizin tüm ürünlerinizin</u> durumunu değiştirecektir.</p>
          </div>

          <form>
            <div class="form-group">
              <label for="orderStatus">Yeni Durum</label>
              <select class="form-select" id="orderStatus" [(ngModel)]="newStatus" name="orderStatus">
                <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeModal($event)">İptal</button>
          <button class="btn-primary" (click)="updateStatus()" [disabled]="updateLoading">
            <span *ngIf="updateLoading" class="loading-spinner"></span>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-orders {
      padding: 0;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .content-header h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #fff;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .orders-table th, .orders-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    .orders-table th {
      font-weight: 500;
      background-color: #f9f9f9;
      color: #666;
    }

    .orders-table tr:last-child td {
      border-bottom: none;
    }

    .order-item {
      margin-bottom: 4px;
    }

    .other-seller-product {
      color: #999;
      font-style: italic;
      font-size: 0.9em;
    }

    .status-badge, .status-badge-sm {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    .status-pending {
      background-color: #FFF8E6;
      color: #F7B924;
    }

    .status-processing {
      background-color: #E3F2FD;
      color: #2196F3;
    }

    .status-shipped {
      background-color: #E8F5E9;
      color: #4CAF50;
    }

    .status-delivered {
      background-color: #E8F5E9;
      color: #388E3C;
    }

    .status-cancelled {
      background-color: #FEEBEE;
      color: #F44336;
    }

    .status-returned {
      background-color: #EDE7F6;
      color: #673AB7;
    }

    .empty-state, .loading-indicator, .error-message {
      padding: 50px 20px;
      text-align: center;
      background-color: #fff;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .empty-state p, .loading-indicator p, .error-message p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .error-message p {
      color: #F44336;
    }

    .btn-group {
      display: flex;
      gap: 5px;
    }

    .btn-details, .btn-update {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .btn-details {
      background-color: #f0f0f0;
      color: #333;
    }

    .btn-update {
      background-color: #e3f2fd;
      color: #2196F3;
    }

    .btn-details:hover {
      background-color: #e0e0e0;
    }

    .btn-update:hover {
      background-color: #bbdefb;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      border-radius: 8px;
      width: 80%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #777;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
      text-align: right;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: #444;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }

    .detail-section p {
      margin: 8px 0;
      font-size: 14px;
      color: #555;
    }

    .order-items-list {
      margin-top: 12px;
    }

    .order-item-detail {
      display: flex;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f5f5f5;
    }

    .order-item-detail:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .order-item-other-sellers {
      margin-top: 20px;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 6px;
      font-style: italic;
      color: #777;
    }

    .item-image {
      width: 60px;
      height: 60px;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-info {
      flex-grow: 1;
    }

    .item-name {
      margin: 0 0 4px;
      font-weight: 500;
      color: #333;
    }

    .item-price, .item-subtotal {
      margin: 4px 0;
      font-size: 13px;
      color: #666;
    }

    .btn-close-modal {
      padding: 8px 16px;
      background-color: #f0f0f0;
      border: none;
      border-radius: 4px;
      color: #333;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-close-modal:hover {
      background-color: #e0e0e0;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #555;
    }

    .form-select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-info {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #888;
    }

    .alert-error {
      padding: 12px;
      background-color: #feebee;
      color: #f44336;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .btn-primary, .btn-secondary {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: #2196F3;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1976D2;
    }

    .btn-primary:disabled {
      background-color: #90CAF9;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #f0f0f0;
      color: #333;
      margin-right: 8px;
    }

    .btn-secondary:hover {
      background-color: #e0e0e0;
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-update-item-status {
      margin-left: 8px;
      padding: 2px 6px;
      font-size: 11px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
    }

    .btn-update-item-status:hover {
      background-color: #e0e0e0;
    }

    .item-status {
      margin-top: 5px;
      display: flex;
      align-items: center;
    }
  `]
})
export class SellerOrdersComponent implements OnInit {
  orders: OrderResponse[] = [];
  loading = true;
  error: string | null = null;
  selectedOrder: OrderResponse | null = null;
  currentSellerId: number | null = null;

  // Durum güncelleme için
  showUpdateModal = false;
  updatingOrder: OrderResponse | null = null;
  updatingItem: OrderItem | null = null;
  isItemUpdate = false;
  newStatus: string = '';
  statusOptions: string[] = [];
  updateLoading = false;
  updateError: string | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentSellerId = this.authService.getCurrentUserId();
    this.statusOptions = this.orderService.getOrderStatuses();
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getSellerOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Siparişler yüklenirken hata oluştu:', err);
        this.error = 'Siparişleri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        this.loading = false;
      }
    });
  }

  getUserInfo(order: OrderResponse): string {
    // Adın ilk 3 harfi, soyadın ilk harfi formatında müşteri bilgisi göster
    if (order.userFirstName && order.userLastName) {
      const firstNamePart = order.userFirstName.length > 3
        ? order.userFirstName.substring(0, 3)
        : order.userFirstName;

      const lastNameInitial = order.userLastName.charAt(0);

      return `${firstNamePart}... ${lastNameInitial}.`;
    }

    // Adres üzerinden müşteri bilgisi göster (isim yoksa)
    if (order.shippingAddress && order.shippingAddress.recipientName) {
      const nameParts = order.shippingAddress.recipientName.split(' ');

      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const firstNamePart = firstName.length > 3 ? firstName.substring(0, 3) : firstName;
        const lastNameInitial = nameParts[nameParts.length - 1].charAt(0);

        return `${firstNamePart}... ${lastNameInitial}.`;
      } else if (nameParts.length === 1) {
        const name = nameParts[0];
        const namePart = name.length > 3 ? name.substring(0, 3) : name;
        return `${namePart}...`;
      }
    }

    return `Müşteri #${order.userId}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      case 'RETURNED': return 'status-returned';
      default: return '';
    }
  }

  showOrderDetails(order: OrderResponse): void {
    this.selectedOrder = order;
  }

  closeModal(event: MouseEvent): void {
    if (event.target instanceof HTMLElement &&
        (event.target.className === 'modal-overlay' ||
         event.target.className === 'modal-container' ||
         event.target.className === 'btn-close')) {
      this.selectedOrder = null;
      this.showUpdateModal = false;
      this.updatingOrder = null;
      this.updateError = null;
    }
  }

  /**
   * Verilen ürünün mevcut satıcıya ait olup olmadığını kontrol eder
   */
  isSellerProduct(item: OrderItem): boolean {
    // Ürünün sellerId'si mevcut satıcının ID'sine eşitse true dön
    return item.sellerId !== undefined && item.sellerId === this.currentSellerId;
  }

  /**
   * Satıcının siparişte yer alan ürünlerini filtreler
   */
  getSellerProducts(order: OrderResponse): OrderItem[] {
    return order.items.filter(item => this.isSellerProduct(item));
  }

  /**
   * Diğer satıcıların ürünlerinin sayısını hesaplar
   */
  getOtherSellerProductsCount(order: OrderResponse): number {
    return order.items.filter(item => !this.isSellerProduct(item)).length;
  }

  /**
   * Satıcının siparişte yer alan ürünlerinin toplam tutarını hesaplar
   */
  getSellerSubtotal(order: OrderResponse): number {
    return this.getSellerProducts(order).reduce(
      (sum, item) => sum + (item.subtotal || (item.price * item.quantity)),
      0
    );
  }

  /**
   * Durum güncelleme modalını açar
   */
  openUpdateStatus(order: OrderResponse): void {
    this.updatingOrder = order;
    this.updatingItem = null;
    this.isItemUpdate = false;
    this.newStatus = order.status;
    this.updateError = null;
    this.showUpdateModal = true;
  }

  openUpdateItemStatus(order: OrderResponse, item: OrderItem): void {
    this.updatingOrder = order;
    this.updatingItem = item;
    this.isItemUpdate = true;
    this.newStatus = item.status || order.status;
    this.updateError = null;
    this.showUpdateModal = true;
  }

  updateStatus(): void {
    if (!this.updatingOrder || !this.newStatus) {
      this.updateError = 'Geçersiz parametre: Sipariş veya durum bilgisi eksik.';
      return;
    }

    this.updateLoading = true;
    this.updateError = null;

    if (this.isItemUpdate) {
      // Tek ürünün durumunu güncelle
      this.orderService.updateSellerOrderItemsStatus(this.updatingOrder.id, this.newStatus).subscribe({
        next: (updatedOrder) => {
          this.handleUpdateSuccess(updatedOrder);
        },
        error: (err) => {
          this.handleUpdateError(err);
        }
      });
    } else {
      // Tüm sipariş ürünlerinin durumunu güncelle
      this.orderService.updateSellerOrderItemsStatus(this.updatingOrder.id, this.newStatus).subscribe({
        next: (updatedOrder) => {
          this.handleUpdateSuccess(updatedOrder);
        },
        error: (err) => {
          this.handleUpdateError(err);
        }
      });
    }
  }

  handleUpdateSuccess(updatedOrder: OrderResponse): void {
    this.updateLoading = false;

    // Sipariş listesindeki ilgili siparişi güncelle
    const index = this.orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
    }

    // Detay görünümü açıksa onu da güncelle
    if (this.selectedOrder && this.selectedOrder.id === updatedOrder.id) {
      this.selectedOrder = updatedOrder;
    }

    // Modali kapat
    this.showUpdateModal = false;
    this.updatingOrder = null;
    this.updatingItem = null;
  }

  handleUpdateError(err: any): void {
    console.error('Sipariş durumu güncellenirken hata oluştu:', err);
    this.updateLoading = false;
    this.updateError = 'Sipariş durumu güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  }
}

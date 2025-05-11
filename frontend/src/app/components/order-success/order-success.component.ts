import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="order-success-container">
      <div class="success-card">
        <div class="success-icon">
          <i class="checkmark">✓</i>
        </div>
        <h1>Ödeme Başarılı!</h1>
        <p>#{{orderId}} numaralı siparişiniz başarıyla oluşturuldu.</p>
        <div class="order-details" *ngIf="orderDetails">
          <h3>Sipariş Özeti</h3>
          <div class="detail-row">
            <span>Sipariş No:</span>
            <span>#{{orderDetails.id}}</span>
          </div>
          <div class="detail-row">
            <span>Tarih:</span>
            <span>{{orderDetails.orderDate | date:'medium'}}</span>
          </div>
          <div class="detail-row">
            <span>Toplam Tutar:</span>
            <span>{{orderDetails.totalAmount | currency}}</span>
          </div>
          <div class="detail-row">
            <span>Durum:</span>
            <span class="status-badge">{{orderDetails.status}}</span>
          </div>
        </div>
        <div class="loading" *ngIf="isLoading">
          Sipariş detayları yükleniyor...
        </div>
        <div class="action-buttons">
          <a routerLink="/account/orders" class="view-orders-btn">Siparişlerimi Görüntüle</a>
          <a routerLink="/" class="continue-shopping-btn">Alışverişe Devam Et</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }

    .success-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 550px;
      width: 100%;
    }

    .success-icon {
      margin: 0 auto 20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #F8FAF5;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .checkmark {
      color: #4CAF50;
      font-size: 46px;
      line-height: 80px;
    }

    h1 {
      color: #4CAF50;
      font-weight: 600;
      margin-bottom: 20px;
    }

    p {
      color: #666;
      margin-bottom: 30px;
    }

    .order-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
      text-align: left;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .status-badge {
      background: #4CAF50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .loading {
      margin: 30px 0;
      color: #666;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .view-orders-btn, .continue-shopping-btn {
      display: block;
      padding: 12px;
      text-align: center;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .view-orders-btn {
      background: #4CAF50;
      color: white;
    }

    .continue-shopping-btn {
      border: 1px solid #4CAF50;
      color: #4CAF50;
    }

    .view-orders-btn:hover {
      background: #3d8b40;
    }

    .continue-shopping-btn:hover {
      background: #f0f8f0;
    }

    @media (max-width: 600px) {
      .success-card {
        padding: 30px 20px;
      }
    }
  `]
})
export class OrderSuccessComponent implements OnInit {
  orderId: string | null = null;
  paymentIntentId: string | null = null;
  orderDetails: any = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    // URL parametrelerini al
    this.route.queryParams.subscribe(params => {
      this.orderId = params['order_id'];
      this.paymentIntentId = params['payment_intent'];

      if (this.orderId) {
        this.loadOrderDetails();
      } else {
        this.alertService.error('Order ID not found in the URL.');
        this.router.navigate(['/']);
      }

      // Eğer payment_intent parametresi varsa, ödemenin durumunu güncelle
      if (this.paymentIntentId) {
        this.confirmPayment();
      }
    });
  }

  loadOrderDetails(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this.orderService.getOrderById(Number(this.orderId)).subscribe({
      next: (order) => {
        this.orderDetails = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.isLoading = false;
        this.alertService.error('Failed to load order details. Please check your orders page.');
      }
    });
  }

  confirmPayment(): void {
    if (!this.paymentIntentId) return;

    this.paymentService.confirmPayment(this.paymentIntentId).subscribe({
      next: (response) => {
        console.log('Payment confirmed:', response);
        // Sipariş detaylarını yeniden yükle, ödeme durumunun güncellenmiş olması lazım
        this.loadOrderDetails();
      },
      error: (error) => {
        console.error('Error confirming payment:', error);
        this.alertService.error('There was an issue confirming your payment. Please contact support.');
      }
    });
  }
}

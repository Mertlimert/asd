import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-seller-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxChartsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="analytics-container">
      <div class="filter-controls">
        <mat-form-field>
          <mat-label>Zaman Aralığı</mat-label>
          <mat-select [(ngModel)]="selectedTimeRange" (selectionChange)="loadAnalytics()">
            <mat-option value="last7days">Son 7 Gün</mat-option>
            <mat-option value="last30days">Son 30 Gün</mat-option>
            <mat-option value="last90days">Son 90 Gün</mat-option>
            <mat-option value="lastYear">Son 1 Yıl</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Veriler yükleniyor...</p>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
        <button mat-raised-button color="primary" (click)="loadAnalytics()">Tekrar Dene</button>
      </div>

      <div *ngIf="!loading && !errorMessage && analyticsData">
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="card-value">₺{{ analyticsData.totalRevenue.toFixed(2) }}</div>
              <div class="card-label">Toplam Gelir</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="card-value">{{ analyticsData.totalOrders }}</div>
              <div class="card-label">Toplam Sipariş</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="card-value">₺{{ analyticsData.averageOrderValue.toFixed(2) }}</div>
              <div class="card-label">Ortalama Sipariş Değeri</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="card-value">{{ analyticsData.pendingOrdersCount }}</div>
              <div class="card-label">Bekleyen Siparişler</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="chart-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Satış Trendi</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ngx-charts-line-chart
                [results]="salesOverTimeChart"
                [gradient]="true"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="true"
                [showYAxisLabel]="true"
                xAxisLabel="Tarih"
                yAxisLabel="Toplam (₺)"
                [autoScale]="true"
                [curve]="curve">
              </ngx-charts-line-chart>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Kategori Dağılımı</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ngx-charts-pie-chart
                [results]="categoryChart"
                [gradient]="true"
                [labels]="true"
                [doughnut]="false">
              </ngx-charts-pie-chart>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="products-orders-row">
          <mat-card class="table-card">
            <mat-card-header>
              <mat-card-title>En Çok Satan Ürünler</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Satış Adedi</th>
                    <th>Toplam Gelir</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let product of analyticsData.topSellingProducts">
                    <td>{{ product.name }}</td>
                    <td>{{ product.quantitySold }}</td>
                    <td>₺{{ product.revenue.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </mat-card-content>
          </mat-card>

          <mat-card class="table-card">
            <mat-card-header>
              <mat-card-title>Son Siparişler</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Sipariş No</th>
                    <th>Müşteri</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of analyticsData.recentOrders">
                    <td>#{{ order.orderId }}</td>
                    <td>{{ order.customerName }}</td>
                    <td>{{ order.orderDate | date: 'dd.MM.yyyy' }}</td>
                    <td [ngClass]="getStatusClass(order.status)">
                      {{ getStatusTranslation(order.status) }}
                    </td>
                    <td>₺{{ order.total.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 20px;
    }

    .filter-controls {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .error-message {
      text-align: center;
      color: #f44336;
      padding: 20px;
      background-color: #ffebee;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
      transition: transform 0.2s;
    }

    .summary-card:hover {
      transform: translateY(-5px);
    }

    .card-value {
      font-size: 24px;
      font-weight: bold;
      color: #4caf50;
      margin-bottom: 5px;
    }

    .card-label {
      font-size: 14px;
      color: #666;
    }

    .chart-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .chart-card, .table-card {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
    }

    .chart-card {
      height: 400px;
    }

    .products-orders-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th, .data-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      text-align: left;
    }

    .data-table th {
      background-color: #f8f9fa;
      color: #333;
      font-weight: 500;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .status-pending {
      color: #ff9800;
    }

    .status-completed, .status-delivered {
      color: #4caf50;
    }

    .status-cancelled {
      color: #f44336;
    }

    @media (max-width: 1024px) {
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .chart-row {
        grid-template-columns: 1fr;
      }

      .products-orders-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SellerAnalyticsComponent implements OnInit {
  private readonly API_URL = 'http://localhost:8080/api/seller/analytics';

  analyticsData: any;
  salesOverTimeChart: any[] = [];
  categoryChart: any[] = [];
  selectedTimeRange = 'last30days';
  curve = 'monotoneX'; // for the line chart
  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.currentUser$.subscribe(
      user => {
        if (user && user.id) {
          // Token'ı AuthService'den alalım
          const token = this.authService.getAuthToken();

          // HTTP başlıklarını oluşturalım
          const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          });

          this.http.get(`${this.API_URL}/${user.id}?timeRange=${this.selectedTimeRange}`, { headers })
            .pipe(
              catchError(this.handleError),
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe(
              (data: any) => {
                this.analyticsData = data;
                this.prepareChartData();
              }
            );
        } else {
          this.errorMessage = 'Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.';
          this.loading = false;
        }
      },
      error => {
        this.errorMessage = 'Kullanıcı bilgileri alınamadı: ' + error.message;
        this.loading = false;
      }
    );
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('API Hatası:', error);

    if (error.status === 0) {
      this.errorMessage = 'Sunucuya erişilemiyor. İnternet bağlantınızı kontrol edin.';
    } else if (error.status === 401) {
      this.errorMessage = 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.';
    } else if (error.status === 403) {
      this.errorMessage = 'Bu verilere erişim yetkiniz bulunmamaktadır.';
    } else if (error.status === 404) {
      this.errorMessage = 'İstenen analiz verileri bulunamadı.';
    } else {
      this.errorMessage = `Bir hata oluştu: ${error.message}`;
    }

    // Geçici olarak mock veri gösterelim
    this.analyticsData = this.getMockData();
    this.prepareChartData();

    throw error;
  }

  getMockData() {
    return {
      totalRevenue: 15780.50,
      totalOrders: 45,
      totalProducts: 12,
      averageOrderValue: 350.68,
      pendingOrdersCount: 5,
      cancelledOrdersCount: 2,
      completedOrdersCount: 38,
      topSellingProducts: [
        { id: 1, name: "Akıllı Telefon X", quantitySold: 15, revenue: 7500.00 },
        { id: 2, name: "Kablosuz Kulaklık Y", quantitySold: 12, revenue: 3600.00 },
        { id: 3, name: "Ultra HD Monitör", quantitySold: 8, revenue: 4000.00 },
        { id: 4, name: "Mekanik Klavye", quantitySold: 6, revenue: 1800.00 }
      ],
      salesOverTime: {
        "2025-05-01": 1200.50,
        "2025-05-02": 980.75,
        "2025-05-03": 1450.25,
        "2025-05-04": 875.30,
        "2025-05-05": 1600.45,
        "2025-05-06": 2100.90,
        "2025-05-07": 1780.15
      },
      salesByCategory: {
        "Elektronik": 8500.50,
        "Bilgisayar": 4200.75,
        "Aksesuarlar": 1800.25,
        "Ev Aletleri": 1280.00
      },
      recentOrders: [
        { orderId: 1001, customerName: "Ahmet Yılmaz", orderDate: "2025-05-07", status: "DELIVERED", total: 580.50 },
        { orderId: 1002, customerName: "Ayşe Kaya", orderDate: "2025-05-06", status: "SHIPPED", total: 1250.75 },
        { orderId: 1003, customerName: "Mehmet Demir", orderDate: "2025-05-05", status: "PROCESSING", total: 320.20 },
        { orderId: 1004, customerName: "Zeynep Aydın", orderDate: "2025-05-04", status: "PENDING", total: 850.00 },
        { orderId: 1005, customerName: "Ali Yıldız", orderDate: "2025-05-03", status: "CANCELLED", total: 450.30 }
      ],
      totalReturns: 3,
      returnsRate: 6.67
    };
  }

  prepareChartData(): void {
    // Satış trendi grafiği için veri hazırlama
    const timeSeriesData = Object.entries(this.analyticsData.salesOverTime).map(([date, value]) => {
      return { name: new Date(date), value: value };
    }).sort((a, b) => a.name.getTime() - b.name.getTime());

    this.salesOverTimeChart = [
      {
        name: 'Satışlar',
        series: timeSeriesData
      }
    ];

    // Kategori dağılımı grafiği için veri hazırlama
    this.categoryChart = Object.entries(this.analyticsData.salesByCategory).map(([category, value]) => {
      return { name: category, value: value };
    });
  }

  getStatusClass(status: string): string {
    status = status.toLowerCase();
    if (status.includes('pending') || status.includes('processing')) {
      return 'status-pending';
    } else if (status.includes('delivered') || status.includes('completed')) {
      return 'status-completed';
    } else if (status.includes('cancelled')) {
      return 'status-cancelled';
    }
    return '';
  }

  getStatusTranslation(status: string): string {
    switch (status) {
      case 'PENDING': return 'Beklemede';
      case 'PROCESSING': return 'İşleniyor';
      case 'CONFIRMED': return 'Onaylandı';
      case 'SHIPPED': return 'Kargoya Verildi';
      case 'DELIVERED': return 'Teslim Edildi';
      case 'RETURNED': return 'İade Edildi';
      case 'CANCELLED': return 'İptal Edildi';
      default: return status;
    }
  }
}

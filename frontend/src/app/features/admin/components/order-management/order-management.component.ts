import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderResponse } from '../../../../services/order.service';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css'],
  providers: [OrderService]
})
export class OrderManagementComponent implements OnInit {
  orders: OrderResponse[] = [];
  filteredOrders: OrderResponse[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Detay modali için değişkenler
  selectedOrder: OrderResponse | null = null;
  showDetailModal: boolean = false;
  
  // Durum güncelleme modali için değişkenler
  showUpdateModal: boolean = false;
  updatingOrder: OrderResponse | null = null;
  newStatus: string = '';
  updateLoading: boolean = false;
  updateError: string | null = null;
  
  // Filtreleme
  statusFilter: string = 'ALL';
  searchTerm: string = '';
  
  // Durum seçenekleri
  statusOptions: string[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.orders];
    
    // Durum filtresi
    if (this.statusFilter !== 'ALL') {
      result = result.filter(order => order.status === this.statusFilter);
    }
    
    // Arama filtresi
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      result = result.filter(order => 
        order.id.toString().includes(search) ||
        order.orderNumber.toLowerCase().includes(search) ||
        (order.userFirstName && order.userFirstName.toLowerCase().includes(search)) ||
        (order.userLastName && order.userLastName.toLowerCase().includes(search))
      );
    }
    
    this.filteredOrders = result;
  }

  // Detay modalını açan fonksiyon
  openOrderDetails(order: OrderResponse): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  // Durum güncelleme modalını açan fonksiyon
  openUpdateStatus(order: OrderResponse): void {
    this.updatingOrder = order;
    this.newStatus = order.status;
    this.showUpdateModal = true;
    this.updateError = null;
  }

  // Modali kapatma fonksiyonu
  closeModal(): void {
    this.showDetailModal = false;
    this.showUpdateModal = false;
    this.selectedOrder = null;
    this.updatingOrder = null;
    this.updateError = null;
  }

  // Sipariş durumunu güncelleyen fonksiyon
  updateOrderStatus(): void {
    if (!this.updatingOrder || !this.newStatus) return;
    
    this.updateLoading = true;
    this.updateError = null;
    
    this.orderService.updateOrderStatus(this.updatingOrder.id, this.newStatus)
      .subscribe({
        next: (updatedOrder) => {
          this.updateLoading = false;
          
          // Updated order bilgisini orders listesinde güncelle
          const index = this.orders.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
          }
          
          this.closeModal();
          this.showSuccessToast(`Order #${updatedOrder.id} status updated successfully`);
        },
        error: (err) => {
          this.updateLoading = false;
          this.updateError = err?.message || 'Failed to update order status';
          console.error('Error updating order status:', err);
        }
      });
  }

  // Yazdırma fonksiyonu
  printOrder(order: OrderResponse): void {
    // Basit bir yazdırma işlevi - gerçek yazdırma işlemleri için genişletilebilir
    console.log('Printing order:', order);
    window.print();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      case 'RETURNED': return 'status-returned';
      default: return 'status-default';
    }
  }

  showSuccessToast(message: string): void {
    // Toast gösterme işlevselliği buraya eklenebilir
    console.log('Success:', message);
    alert(message);
  }
} 
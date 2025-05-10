import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class CheckoutSuccessComponent implements OnInit {
  orderId: string | null = null;
  orderNumber: string | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Sipariş bilgilerini session storage'dan al
    this.orderId = sessionStorage.getItem('orderId');
    this.orderNumber = sessionStorage.getItem('orderNumber');

    // Sipariş bilgileri yoksa ana sayfaya yönlendir
    if (!this.orderId || !this.orderNumber) {
      this.router.navigate(['/']);
      return;
    }

    // Ödeme tamamlandığında checkout verilerini temizle
    sessionStorage.removeItem('shippingAddressId');
    sessionStorage.removeItem('billingAddressId');
    sessionStorage.removeItem('paymentMethod');
    sessionStorage.removeItem('cardData');
  }

  // Siparişler sayfasına git
  viewOrders(): void {
    this.router.navigate(['/account/orders']);
  }

  // Alışverişe devam et
  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}

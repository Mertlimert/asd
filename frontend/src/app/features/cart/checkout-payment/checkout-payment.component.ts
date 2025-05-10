import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class CheckoutPaymentComponent implements OnInit {
  selectedPaymentMethod: string = 'CREDIT_CARD';
  paymentMethods: string[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // Adres seçimi yapılmış mı kontrol et
    const shippingAddressId = sessionStorage.getItem('shippingAddressId');
    if (!shippingAddressId) {
      this.router.navigate(['/checkout/address']);
      return;
    }

    // Ödeme yöntemlerini al
    this.paymentMethods = this.orderService.getPaymentMethods();
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CREDIT_CARD':
        return 'Kredi Kartı';
      case 'CASH_ON_DELIVERY':
        return 'Kapıda Ödeme';
      case 'BANK_TRANSFER':
        return 'Banka Transferi';
      default:
        return method;
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'CREDIT_CARD':
        return 'fa-credit-card';
      case 'CASH_ON_DELIVERY':
        return 'fa-money-bill';
      case 'BANK_TRANSFER':
        return 'fa-university';
      default:
        return 'fa-credit-card';
    }
  }

  confirmPayment(): void {
    // Ödeme yöntemini kaydet ve onay sayfasına yönlendir
    sessionStorage.setItem('paymentMethod', this.selectedPaymentMethod);
    this.router.navigate(['/checkout/confirm']);
  }

  proceedToConfirmation(): void {
    this.confirmPayment();
  }
}

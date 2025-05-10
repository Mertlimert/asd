import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class CartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  loading$: Observable<boolean>;
  error: string | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.getCartItems().pipe(
      map(items => items || [])
    );
    this.loading$ = this.cartService.isLoading();
  }

  ngOnInit(): void {
    this.cartService.loadCart();
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      return;
    }

    if (!item.product?.id) {
      this.error = 'Geçersiz ürün bilgisi';
      return;
    }

    this.error = null;
    this.cartService.updateQuantity(item.product.id, newQuantity)
      .subscribe({
        error: (err) => {
          this.error = err.message || 'Miktar güncellenirken bir hata oluştu';
        }
      });
  }

  removeItem(productId: number): void {
    if (!productId) {
      this.error = 'Geçersiz ürün ID\'si';
      return;
    }

    this.error = null;
    this.cartService.removeFromCart(productId)
      .subscribe({
        error: (err) => {
          this.error = err.message || 'Ürün sepetten çıkarılırken bir hata oluştu';
        }
      });
  }

  clearCart(): void {
    this.error = null;
    this.cartService.clearCart()
      .subscribe({
        error: (err) => {
          this.error = err.message || 'Sepet temizlenirken bir hata oluştu';
        }
      });
  }

  getTotalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  getTotalItems(): number {
    return this.cartService.getTotalItems();
  }

  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout/address' }
      });
      return;
    }

    this.router.navigate(['/checkout/address']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, CartItemComponent]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  isLoading: boolean = false;
  isLoggedIn: boolean = false;
  isCheckingOut: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private orderService: OrderService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    // First check authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;

      if (this.isLoggedIn) {
        this.loadCartItems();
      }
    });

    this.trackLoadingState();
  }

  trackLoadingState(): void {
    this.cartService.isLoading().subscribe(loading => {
      this.isLoading = loading;
    });
  }

  loadCartItems(): void {
    if (!this.isLoggedIn) {
      return;
    }

    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  handleStockExceeded(errorMessage: string): void {
    this.alertService.error(errorMessage);
  }

  removeFromCart(productId: number | undefined): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to modify your cart.'); // Use AlertService
      this.router.navigate(['/login']);
      return;
    }

    if (productId !== undefined) {
      const itemToRemove = this.cartItems.find(item => item.product.id === productId);
      this.cartService.removeFromCart(productId).subscribe({
        next: () => {
          // Cart updated successfully (handled by service)
          if (itemToRemove) {
            this.alertService.success(`'${itemToRemove.product.name}' removed from cart.`); // Use AlertService
          }
        },
        error: (error) => {
          console.error('Error removing item:', error);
          const message = error?.error?.message || error?.message || 'Failed to remove item. Please try again.';
          this.alertService.error(message); // Use AlertService
        }
      });
    }
  }

  updateQuantity(productId: number | undefined, quantity: number): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Sepeti güncellemek için giriş yapmalısınız.');
      this.router.navigate(['/login']);
      return;
    }

    if (productId !== undefined) {
      if (quantity > 0) {
        const itemToUpdate = this.cartItems.find(item => item.product.id === productId);

        // Önce ürünün stok miktarını kontrol et
        if (itemToUpdate && itemToUpdate.product && quantity > itemToUpdate.product.stock_quantity) {
          const errorMessage = `Stok sınırı aşıldı: Bu üründen en fazla ${itemToUpdate.product.stock_quantity} adet ekleyebilirsiniz.`;
          this.alertService.error(errorMessage);
          return;
        }

        this.cartService.updateQuantity(productId, quantity).subscribe({
          next: () => {
            // Cart updated successfully (handled by service)
            if (itemToUpdate) {
              this.alertService.success(`'${itemToUpdate.product.name}' ürününün miktarı ${quantity} olarak güncellendi.`);
            }
          },
          error: (error) => {
            console.error('Error updating quantity:', error);
            const message = error?.error?.message || error?.message || 'Miktar güncellenirken hata oluştu. Lütfen tekrar deneyin.';
            this.alertService.error(message);

            // Hata durumunda güncel sepet durumunu tekrar yükle
            this.loadCartItems();
          }
        });
      } else {
        // Quantity is 0 or less, treat as removal
        this.removeFromCart(productId);
      }
    }
  }

  clearCart(): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to clear your cart.'); // Use AlertService
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.clearCart().subscribe({
      next: () => {
        // Cart cleared successfully (handled by service)
        this.alertService.success('Cart cleared successfully.'); // Use AlertService
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        const message = error?.error?.message || error?.message || 'Failed to clear cart. Please try again.';
        this.alertService.error(message); // Use AlertService
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  checkout(): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Ödeme yapmak için giriş yapmalısınız.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (this.cartItems.length === 0) {
      this.alertService.warn('Sepetiniz boş. Lütfen ürün ekleyin.');
      return;
    }

    // Teslimat adresi sayfasına yönlendir
    this.router.navigate(['/checkout/address']);
  }
}

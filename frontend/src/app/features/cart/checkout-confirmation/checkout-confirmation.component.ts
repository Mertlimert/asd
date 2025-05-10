import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService, OrderRequest } from '../../../services/order.service';
import { AddressService, Address } from '../../../services/address.service';
import { CartItem } from '../../../models/cart-item.model';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-checkout-confirmation',
  templateUrl: './checkout-confirmation.component.html',
  styleUrls: ['./checkout-confirmation.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class CheckoutConfirmationComponent implements OnInit {
  cartItems: CartItem[] = [];
  shippingAddress: Address | null = null;
  billingAddress: Address | null = null;
  paymentMethod: string = '';
  cardData: any = null;

  totalPrice: number = 0;
  shippingPrice: number = 0;

  loading = true;
  orderLoading = false;
  error: string | null = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private addressService: AddressService,
    private router: Router,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    // Adres ve ödeme bilgilerinin session storage'da olup olmadığını kontrol et
    const shippingAddressId = sessionStorage.getItem('shippingAddressId');
    const billingAddressId = sessionStorage.getItem('billingAddressId');
    const paymentMethod = sessionStorage.getItem('paymentMethod');

    if (!shippingAddressId || !paymentMethod) {
      // Eğer adres veya ödeme bilgileri yoksa uygun sayfaya yönlendir
      if (!shippingAddressId) {
        this.router.navigate(['/checkout/address']);
      } else {
        this.router.navigate(['/checkout/payment']);
      }
      return;
    }

    this.paymentMethod = paymentMethod;

    // Adresleri ve sepet içeriğini yükle
    const getShippingAddress$ = this.addressService.getAddressById(Number(shippingAddressId))
      .pipe(
        tap(address => this.shippingAddress = address),
        catchError(err => {
          this.error = 'Teslimat adresi bilgileri yüklenemedi';
          return of(null);
        })
      );

    let getBillingAddress$: Observable<Address | null> = of(null);
    if (billingAddressId) {
      getBillingAddress$ = this.addressService.getAddressById(Number(billingAddressId))
        .pipe(
          tap(address => this.billingAddress = address),
          catchError(err => {
            this.error = 'Fatura adresi bilgileri yüklenemedi';
            return of(null);
          })
        );
    }

    // Sepet içeriğini yükle
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();

      // Kapıda ödeme seçildiyse ek ücret ekle
      if (this.paymentMethod === 'CASH_ON_DELIVERY') {
        this.shippingPrice = 5.0; // Kapıda ödeme ücreti
      }

      // Adres bilgilerini yükle
      forkJoin([getShippingAddress$, getBillingAddress$]).subscribe(
        () => {
          this.loading = false;
        },
        (err) => {
          this.error = 'Sipariş bilgileri yüklenirken bir hata oluştu';
          this.loading = false;
        }
      );
    });
  }

  getPaymentMethodLabel(): string {
    switch (this.paymentMethod) {
      case 'CREDIT_CARD':
        return 'Kredi Kartı';
      case 'CASH_ON_DELIVERY':
        return 'Kapıda Ödeme';
      case 'BANK_TRANSFER':
        return 'Banka Transferi';
      default:
        return this.paymentMethod;
    }
  }

  getCardInfo(): string {
    return "Stripe güvenli ödeme sistemi ile ödeme yapacaksınız.";
  }

  placeOrder(): void {
    if (!this.shippingAddress) {
      this.error = 'Teslimat adresi seçilmedi';
      return;
    }

    if (this.orderLoading) {
      return;
    }

    this.orderLoading = true;
    this.error = null;

    // Sipariş isteği oluştur
    const orderRequest: OrderRequest = {
      shippingAddressId: this.shippingAddress.id!,
      paymentMethod: this.paymentMethod
    };

    // Fatura adresi varsa ekle
    if (this.billingAddress) {
      orderRequest.billingAddressId = this.billingAddress.id;
    }

    // Siparişi oluştur
    this.orderService.createOrder(orderRequest).subscribe({
      next: (order) => {
        // Stripe ile ödeme işlemi için gerekli URL'leri hazırla
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/order-success?order_id=${order.id}`;
        const cancelUrl = `${baseUrl}/checkout/confirmation`;

        // Kredi kartı ödeme yöntemi seçildiyse Stripe ödeme sayfasına yönlendir
        if (this.paymentMethod === 'CREDIT_CARD') {
          console.log('Kredi kartı ödeme yöntemi seçildi, Stripe checkout session oluşturuluyor...');
          console.log('Sipariş bilgileri:', JSON.stringify({
            id: order.id,
            totalAmount: order.totalAmount
          }));
          console.log('Success URL:', successUrl);
          console.log('Cancel URL:', cancelUrl);

          // Hata kontrolü için timeout ayarla, 20 saniye sonra işlem başarısız sayılır
          const timeoutPromise = new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error('Ödeme sayfası oluşturma zaman aşımına uğradı')), 20000);
          });

          // CheckoutSession oluştur
          this.paymentService.createCheckoutSession(order.id, successUrl, cancelUrl).subscribe({
            next: (sessionData) => {
              console.log('Checkout session oluşturuldu:', sessionData);

              if (!sessionData || !sessionData.sessionUrl) {
                this.orderLoading = false;
                this.error = 'API yanıtı geçersiz: Ödeme sayfası URL\'si alınamadı';
                console.error('API yanıtı geçersiz:', sessionData);
                return;
              }

              console.log('Session URL:', sessionData.sessionUrl);

              // Ödeme oturumu ID'sini sessionStorage'a kaydet
              sessionStorage.setItem('orderId', order.id.toString());
              sessionStorage.setItem('orderNumber', order.orderNumber);

              try {
                // Ödeme sayfasına yönlendir
                window.location.href = sessionData.sessionUrl;
              } catch (e: any) {
                console.error('Yönlendirme hatası:', e);
                this.orderLoading = false;
                this.error = 'Ödeme sayfasına yönlendirme sırasında bir hata oluştu: ' + e.message;
              }
            },
            error: (error) => {
              console.error('Ödeme oturumu oluşturma hatası:', error);

              // HTTP status kodunu kontrol et
              if (error.status === 500) {
                console.error('Sunucu hatası (500):', error);
                this.error = 'Sunucu hatası: Ödeme sayfası oluşturulamadı. Lütfen daha sonra tekrar deneyiniz.';
              } else if (error.status === 404) {
                this.error = 'Sipariş bulunamadı.';
              } else if (error.status === 400) {
                this.error = 'Geçersiz istek. Lütfen tüm bilgilerin doğru olduğunu kontrol ediniz.';
              } else {
                this.error = this.getErrorMessage(error);
              }

              this.orderLoading = false;
              console.error('Tam hata:', error);
            }
          });
        } else {
          // Diğer ödeme yöntemleri için normal işleme devam et
          this.orderLoading = false;

          // Sipariş numarasını session storage'a kaydet
          sessionStorage.setItem('orderId', order.id.toString());
          sessionStorage.setItem('orderNumber', order.orderNumber);

          // Session storage'dan adres ve ödeme bilgilerini temizle
          sessionStorage.removeItem('shippingAddressId');
          sessionStorage.removeItem('billingAddressId');
          sessionStorage.removeItem('paymentMethod');
          sessionStorage.removeItem('cardData');

          // Sepeti temizle
          this.cartService.clearCart().subscribe();

          // Başarı sayfasına yönlendir
          this.router.navigate(['/checkout/success']);
        }
      },
      error: (error) => {
        this.orderLoading = false;
        if (error && error.error && error.error.message) {
          this.error = error.error.message;
        } else if (error && error.message) {
          this.error = error.message;
        } else {
          this.error = 'Sipariş oluşturulurken bir hata meydana geldi';
        }
        console.error('Sipariş oluşturma hatası:', error);
      }
    });
  }

  /**
   * Hata mesajını formatla
   */
  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    }
    return 'Ödeme sayfası hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

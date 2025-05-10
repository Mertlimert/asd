import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';

declare var Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private stripe: any;
  private stripePublicKey: string = '';

  constructor(private http: HttpClient) {
    this.loadStripeConfig();
  }

  /**
   * Stripe API anahtarını alma ve Stripe objesini başlatma
   */
  private loadStripeConfig(): void {
    console.log('Stripe yapılandırması yükleniyor...');
    this.http.get<{ publicKey: string }>(`${this.apiUrl}/config`).subscribe(
      (data) => {
        console.log('Stripe config loaded:', data);
        if (!data.publicKey) {
          console.error('Stripe public key boş!');
          return;
        }

        this.stripePublicKey = data.publicKey;

        // Stripe.js'nin yüklenip yüklenmediğini kontrol et
        if (typeof Stripe === 'undefined') {
          console.error('Stripe.js yüklenmedi! index.html dosyasında script tag\'inin olduğundan emin olun.');
          return;
        }

        try {
          // Stripe objesini başlat
          this.stripe = Stripe(this.stripePublicKey);
          console.log('Stripe objesi başarıyla oluşturuldu.');
        } catch (error) {
          console.error('Stripe objesi oluşturulurken hata:', error);
        }
      },
      (error) => {
        console.error('Stripe config error:', error);
      }
    );
  }

  /**
   * Sipariş için bir Stripe Checkout oturumu oluşturma ve yönlendirme
   */
  createCheckoutSession(
    orderId: number,
    successUrl: string,
    cancelUrl: string
  ): Observable<{ sessionUrl: string }> {
    // Backend'e checkout session oluşturmak için istek gönder
    return this.http.post<{ sessionUrl: string }>(
      `${this.apiUrl}/create-checkout-session/${orderId}`,
      { successUrl, cancelUrl }
    );
  }

  /**
   * Stripe Checkout başlat
   */
  redirectToCheckout(sessionUrl: string): Observable<any> {
    console.log('Stripe checkout başlatılıyor:', sessionUrl);

    if (!this.stripe) {
      console.error('Stripe objesi henüz yüklenmedi');

      // Stripe yüklenmemiş, yeniden yüklemeyi dene
      try {
        if (typeof Stripe !== 'undefined' && this.stripePublicKey) {
          console.log('Stripe objesini yeniden oluşturmayı deniyorum...');
          this.stripe = Stripe(this.stripePublicKey);
        } else {
          return from(Promise.reject('Stripe.js yüklenmemiş veya public key bulunamadı'));
        }
      } catch (error) {
        console.error('Stripe objesi yeniden oluşturulurken hata:', error);
        return from(Promise.reject('Stripe objesi oluşturulamadı: ' + error));
      }

      // Stripe hala yüklenmediyse
      if (!this.stripe) {
        return from(Promise.reject('Stripe objesi oluşturulamadı'));
      }
    }

    // URL'den session ID'yi ayıkla
    const sessionId = this.extractSessionId(sessionUrl);
    if (sessionId) {
      console.log('Stripe session ID:', sessionId);
      try {
        return from(this.stripe.redirectToCheckout({ sessionId }));
      } catch (error) {
        console.error('Stripe.redirectToCheckout hatası:', error);
        return from(Promise.reject('Stripe checkout yönlendirme hatası: ' + error));
      }
    } else {
      console.log('Session ID çıkarılamadı, tam URL ile yönlendiriliyor:', sessionUrl);
      // Eğer session ID çıkarılamazsa, tam URL'ye yönlendir
      window.location.href = sessionUrl;
      return from(Promise.resolve({ success: true }));
    }
  }

  /**
   * URL'den Session ID çıkarma
   */
  private extractSessionId(url: string): string | null {
    try {
      if (url.includes('/checkout/session/')) {
        // URL'den session ID'yi ayıkla (örnek: https://checkout.stripe.com/c/pay/cs_test_a1b2c3...)
        const parts = url.split('/');
        return parts[parts.length - 1];
      } else if (url.includes('?session_id=')) {
        // URL'deki session_id parametresini ayıkla
        const sessionIdParam = new URL(url).searchParams.get('session_id');
        return sessionIdParam;
      }
      return null;
    } catch (e) {
      console.error('Session ID çıkarılırken hata:', e);
      return null;
    }
  }

  /**
   * Ödeme yöntemi ekleme
   */
  addPaymentMethod(
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvc: string,
    cardHolderName: string,
    makeDefault: boolean
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment-methods`, {
      cardNumber,
      expiryMonth,
      expiryYear,
      cvc,
      cardHolderName,
      makeDefault
    });
  }

  /**
   * Ödeme başarılı olduğunda çağrılır
   */
  confirmPayment(paymentIntentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/success/${paymentIntentId}`);
  }
}

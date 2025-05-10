import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container">
      <form (ngSubmit)="onSubmit()">
        <h2>Giriş Yap</h2>

        <div *ngIf="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="email">E-posta</label>
          <input
            type="email"
            id="email"
            [(ngModel)]="email"
            name="email"
            placeholder="E-posta adresiniz"
            required
            [disabled]="loading"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="password">Şifre</label>
          <input
            type="password"
            id="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Şifreniz"
            required
            [disabled]="loading"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <button type="submit" [disabled]="loading" class="login-button">
            {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
          </button>
        </div>

        <div class="register-link">
          Hesabınız yok mu? <a routerLink="/register">Kayıt olun</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 8px;
      background-color: white;
    }

    h2 {
      text-align: center;
      margin-bottom: 24px;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      border-color: #007bff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .login-button {
      width: 100%;
      padding: 12px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: background-color 0.3s;
    }

    .login-button:hover {
      background-color: #0069d9;
    }

    .login-button:disabled {
      background-color: #7bb6ff;
      cursor: not-allowed;
    }

    .alert {
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .register-link {
      text-align: center;
      margin-top: 16px;
      font-size: 14px;
    }

    .register-link a {
      color: #007bff;
      text-decoration: none;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  onSubmit() {
    // Form doğrulaması
    if (!this.email || !this.password) {
      this.error = 'Lütfen e-posta ve şifrenizi giriniz';
      return;
    }

    this.loading = true;
    this.error = '';

    // Giriş işlemi
    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (user) => {
        this.loading = false;

        // Başarılı giriş
        this.alertService.success('Giriş başarılı!');

        // Kullanıcı rolüne göre yönlendirme
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else if (this.authService.isSeller()) {
          this.router.navigate(['/seller']);
        } else {
          // Normal kullanıcı
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading = false;

        // Hata mesajını göster
        this.error = err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.';

        // Ayrıca alert servisi ile de göster
        this.alertService.error(this.error);
      }
    });
  }
}

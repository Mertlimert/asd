import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // LocalStorage'den doğrudan token alma denemesi
    let token = this.authService.getAuthToken();

    // Eğer servis üzerinden token alınamadıysa localStorage'den doğrudan almayı deneyelim
    if (!token && typeof window !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (user) {
        try {
          const userObj = JSON.parse(user);
          token = userObj.token;
          console.log('Token localStorage\'den alındı:', !!token);
        } catch (e) {
          console.error('LocalStorage\'den user parse hatası:', e);
        }
      }
    }

    // Debug için token varlığını ve ilk karakterlerini loglayalım
    console.log('Auth Interceptor Token present:', !!token);
    if (token) {
      console.log('Token starts with:', token.substring(0, 10) + '...');

      // Token varsa isteğe ekle
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}

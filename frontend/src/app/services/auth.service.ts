import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (this.isBrowser) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error parsing user from localStorage', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }

  register(userData: RegisterRequest): Observable<User> {
    // Log the data being sent to help with debugging
    console.log('Registering user with data:', userData);

    // Ensure required fields are present and not empty
    if (!userData.username || !userData.email || !userData.password) {
      return throwError(() => ({ message: 'Username, email, and password are required' }));
    }

    // Create a user object with the correct structure matching backend expectations
    const userToRegister = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || '',  // Default to empty string if undefined
      lastName: userData.lastName || '',    // Default to empty string if undefined
      role: userData.role || 'USER',        // Default to USER if role is not specified
      banned: false                         // Users are not banned by default
    };

    console.log('Sending formatted user data:', userToRegister);

    return this.http.post<User>(`${this.apiUrl}/register`, userToRegister).pipe(
      tap(user => {
        console.log('Registration successful:', user);
        this.storeUserData(user);
      }),
      catchError(error => {
        console.error('Registration error details:', error);
        if (error.error && error.error.message) {
          return throwError(() => ({ message: error.error.message }));
        }
        return throwError(() => ({ message: 'Registration failed. Please try again.' }));
      })
    );
  }

  // Admin için özel kullanıcı oluşturma metodu - oturum açmadan sadece kullanıcı kaydı yapar
  adminRegister(userData: RegisterRequest): Observable<User> {
    console.log('Admin registering new user with data:', userData);

    // Ensure required fields are present and not empty
    if (!userData.username || !userData.email || !userData.password) {
      return throwError(() => ({ message: 'Username, email, and password are required' }));
    }

    // Create a user object with the correct structure matching backend expectations
    const userToRegister = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'USER',
      banned: userData.banned || false
    };

    // Özel HTTP isteği ile direkt olarak işleyelim, Observable<HttpResponse> olarak değil Observable<User> olarak dönelim
    return new Observable<User>(observer => {
      // Backend HTTP isteği
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.apiUrl}/register`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      // Mevcut oturumu korumak için token'ı yönetelim
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log('Admin registration successful:', response);

          // Başarılı cevabı döndür ama localStorage'e kaydetme
          observer.next(response);
          observer.complete();
        } else {
          console.error('Admin registration error:', xhr.statusText);
          observer.error({ message: 'User registration failed: ' + xhr.statusText });
        }
      };

      xhr.onerror = () => {
        console.error('Network error during admin registration');
        observer.error({ message: 'Network error during registration' });
      };

      xhr.send(JSON.stringify(userToRegister));
    });
  }

  login(credentials: LoginRequest): Observable<User> {
    const loginData = {
      email: credentials.email.trim(),
      password: credentials.password
    };

    return this.http.post<User>(`${this.apiUrl}/login`, loginData).pipe(
      tap(user => {
        this.storeUserData(user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        if (error.error && typeof error.error === 'string') {
          return throwError(() => ({ message: error.error }));
        }
        return throwError(() => ({
          message: error.error?.message || 'Login failed. Please check your credentials and try again.'
        }));
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  // User management methods
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(userId: number, userData: any): Observable<User> {
    // Sadece DTO'da olan alanları seçerek gönder
    const updateData = {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role,
      password: userData.password || '',
      banned: userData.banned
    };

    // Detaylı loglama ekle
    console.log('Güncellenen kullanıcı ID:', userId);
    console.log('Güncellenen kullanıcı verisi:', JSON.stringify(updateData, null, 2));
    console.log('API URL:', `${this.apiUrl}/${userId}`);

    // Admin kullanıcısı veya yeni oluşturulan hesaplar için XHR kullan
    const isCurrentAdmin = this.isAdmin();
    const currentUserId = this.getCurrentUserId();

    // Eğer giriş yapmış admin kullanıcısı başka bir kullanıcıyı düzenliyorsa
    if (isCurrentAdmin && currentUserId !== userId) {
      return new Observable<User>(observer => {
        // Backend HTTP isteği
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${this.apiUrl}/${userId}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Admin token'ını gönder
        const token = this.getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            console.log('Kullanıcı güncelleme başarılı:', response);
            observer.next(response);
            observer.complete();
          } else {
            console.error('Kullanıcı güncelleme hatası:', xhr.statusText);
            observer.error({ message: 'Kullanıcı güncellenemedi: ' + xhr.statusText });
          }
        };

        xhr.onerror = () => {
          console.error('Ağ hatası');
          observer.error({ message: 'Ağ hatası oluştu' });
        };

        xhr.send(JSON.stringify(updateData));
      });
    }

    // Normal yol - HttpClient ile istek
    return this.http.put<User>(`${this.apiUrl}/${userId}`, updateData)
      .pipe(
        tap(response => console.log('Başarılı yanıt:', response)),
        catchError(error => {
          console.error('Kullanıcı güncelleme hatası detayları:', JSON.stringify(error, null, 2));
          return this.handleError(error);
        })
      );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private storeUserData(user: User): void {
    // Token'ı log'layarak kontrol edelim
    console.log('Token stored:', user.token ? 'Present' : 'Missing', user);

    if (this.isBrowser) {
      // Token yoksa veya boşsa uyarı verelim
      if (!user.token) {
        console.warn('User has no token!', user);
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  // Yeni metot: Subject'i güncellemek için
  updateCurrentUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return !!this.currentUserSubject.value && this.currentUserSubject.value.role === UserRole.ADMIN;
  }

  isSeller(): boolean {
    return this.isSellerOrAdmin();
  }

  isSellerOrAdmin(): boolean {
    return !!this.currentUserSubject.value &&
      (this.currentUserSubject.value.role === UserRole.SELLER ||
       this.currentUserSubject.value.role === UserRole.ADMIN);
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id || null;
  }

  getAuthToken(): string | null {
    const currentUser = this.currentUserSubject.value;

    // Önce bellek içindeki değeri kontrol et
    if (currentUser?.token) {
      return currentUser.token;
    }

    // Bellek içinde yoksa localStorage'den almaya çalış
    if (this.isBrowser) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const storedUser = JSON.parse(userJson);
          if (storedUser?.token) {
            // İlgili token varsa, belleği de güncelle
            this.currentUserSubject.next(storedUser);
            return storedUser.token;
          }
        } catch (e) {
          console.error('Token alırken parse hatası:', e);
        }
      }
    }

    return null;
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth service error', error);
    return throwError(() => error.error?.message || 'Something went wrong');
  }
}

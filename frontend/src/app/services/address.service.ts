import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Address {
  id?: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  addressName: string;
  recipientName: string;
  isDefault?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'http://localhost:8080/api/addresses';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getUserAddresses(): Observable<Address[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<Address[]>(`${this.apiUrl}/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getAddressById(addressId: number): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<Address>(`${this.apiUrl}/${userId}/address/${addressId}`)
      .pipe(catchError(this.handleError));
  }

  getDefaultAddress(): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.get<Address>(`${this.apiUrl}/${userId}/default`)
      .pipe(catchError(this.handleError));
  }

  createAddress(address: Address): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.post<Address>(`${this.apiUrl}/${userId}`, address)
      .pipe(catchError(this.handleError));
  }

  updateAddress(addressId: number, address: Address): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.put<Address>(`${this.apiUrl}/${userId}/address/${addressId}`, address)
      .pipe(catchError(this.handleError));
  }

  setAsDefaultAddress(addressId: number): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.put<Address>(`${this.apiUrl}/${userId}/address/${addressId}/default`, {})
      .pipe(catchError(this.handleError));
  }

  deleteAddress(addressId: number): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Kullanıcı ID bulunamadı'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${userId}/address/${addressId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Bir hata oluştu';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.error?.detail || `Hata kodu: ${error.status}, Mesaj: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}

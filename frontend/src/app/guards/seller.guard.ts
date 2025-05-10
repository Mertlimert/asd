import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SellerGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Allow if user is a SELLER or ADMIN
    if (this.authService.isSellerOrAdmin()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
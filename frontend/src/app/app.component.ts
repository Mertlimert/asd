import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';
import { User, UserRole } from './models/user.model'; // Import UserRole enum
import { AlertService } from './services/alert.service';
import { AlertComponent } from './components/alert/alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FormsModule, AlertComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'E-Commerce Store';
  cartItemCount = 0;
  currentUser: User | null = null;
  searchQuery: string = '';
  isDropdownOpen: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItemCount = this.cartService.getTotalItems();
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.authService.isLoggedIn()) {
      if(this.currentUser?.banned) {
        // Use AlertService instead of alert()
        this.alertService.error('Your account has been banned. Please contact support.', false);
        this.authService.logout(); // Logout happens immediately after showing the alert
        // No need to navigate here, logout likely handles redirection or the guard will
      }
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Add methods to check user roles
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  isSeller(): boolean {
    return this.currentUser?.role === UserRole.SELLER || this.currentUser?.role === UserRole.ADMIN;
  }

  logout(): void {
    const username = this.currentUser?.username; // Get username before logging out
    this.authService.logout();
    // Show success alert after logout
    this.alertService.success(`User ${username} logged out successfully.`);
  }

  onSearch(): void {
    if (this.searchQuery === '') {
      this.router.navigate(['/']);
    }

    if (this.searchQuery.trim()) {
      this.router.navigate(['/'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="seller-dashboard">
      <div class="dashboard-sidebar">
        <div class="seller-profile" *ngIf="currentUser">
          <div class="profile-avatar">{{ getUserInitials() }}</div>
          <div class="profile-info">
            <h3>{{ currentUser.firstName || currentUser.username }}</h3>
            <p>Seller Account</p>
          </div>
        </div>

        <nav class="dashboard-nav">
          <a [routerLink]="['./products']" routerLinkActive="active" class="nav-item">
            <i class="nav-icon">📦</i>
            <span>My Products</span>
          </a>
          <a [routerLink]="['./create']" routerLinkActive="active" class="nav-item">
            <i class="nav-icon">✏️</i>
            <span>Add New Product</span>
          </a>
          <a [routerLink]="['./orders']" routerLinkActive="active" class="nav-item">
            <i class="nav-icon">📋</i>
            <span>Orders</span>
          </a>
          <a [routerLink]="['./analytics']" routerLinkActive="active" class="nav-item">
            <i class="nav-icon">📊</i>
            <span>Analytics</span>
          </a>
        </nav>
      </div>

      <div class="dashboard-content">
        <div class="content-header">
          <h2>Seller Dashboard</h2>
          <div class="date">{{ today | date:'longDate' }}</div>
        </div>

        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-dashboard {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: calc(100vh - 64px);
      background-color: #f8f9fa;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .dashboard-sidebar {
      background-color: #343a40;
      color: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
    }

    .seller-profile {
      display: flex;
      align-items: center;
      padding: 24px 20px;
      background-color: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .profile-avatar {
      width: 50px;
      height: 50px;
      background-color: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      margin-right: 12px;
    }

    .profile-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .profile-info p {
      margin: 4px 0 0;
      font-size: 14px;
      opacity: 0.7;
    }

    .dashboard-nav {
      display: flex;
      flex-direction: column;
      padding: 20px 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.3s;
      border-left: 3px solid transparent;
      font-size: 15px;
    }

    .nav-item:hover {
      background-color: rgba(255,255,255,0.1);
      color: #fff;
    }

    .nav-item.active {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4CAF50;
      border-left: 3px solid #4CAF50;
    }

    .nav-icon {
      width: 24px;
      margin-right: 12px;
      text-align: center;
    }

    .dashboard-content {
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .content-header {
      padding: 20px 30px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 5;
    }

    .content-header h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: 500;
    }

    .date {
      color: #666;
      font-size: 14px;
    }

    .content-body {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
    }

    @media (max-width: 992px) {
      .seller-dashboard {
        grid-template-columns: 220px 1fr;
      }
    }

    @media (max-width: 768px) {
      .seller-dashboard {
        grid-template-columns: 1fr;
      }

      .dashboard-sidebar {
        position: fixed;
        top: 64px;
        left: -280px;
        width: 280px;
        height: calc(100vh - 64px);
        z-index: 1000;
        transition: left 0.3s ease;
      }

      .dashboard-sidebar.show {
        left: 0;
      }

      .content-body {
        padding: 20px;
      }
    }
  `]
})
export class SellerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  today = new Date();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
    }

    if (this.currentUser.firstName) {
      return this.currentUser.firstName.charAt(0);
    }

    return this.currentUser.username ? this.currentUser.username.charAt(0).toUpperCase() : 'S';
  }
}

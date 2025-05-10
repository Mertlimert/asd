import { Component } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="admin-dashboard">
      <nav class="admin-nav">
        <div class="nav-header">
          <h2>Admin Panel</h2>
        </div>
        <a routerLink="./products" routerLinkActive="active">
          <i class="nav-icon">📦</i>
          <span>Products</span>
        </a>
        <a routerLink="./users" routerLinkActive="active">
          <i class="nav-icon">👥</i>
          <span>Users</span>
        </a>
        <a routerLink="./categories" routerLinkActive="active">
          <i class="nav-icon">🏷️</i>
          <span>Categories</span>
        </a>
        <a routerLink="./orders" routerLinkActive="active">
          <i class="nav-icon">📋</i>
          <span>Orders</span>
        </a>
      </nav>
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 0;
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: calc(100vh - 70px);
      background-color: #f8f9fa;
    }

    .admin-nav {
      display: flex;
      flex-direction: column;
      background-color: #343a40;
      color: #fff;
      height: 100%;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }

    .nav-header {
      padding: 20px;
      background-color: #212529;
      margin-bottom: 10px;
    }

    .nav-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 300;
      color: #fff;
    }

    .admin-nav a {
      padding: 15px 20px;
      text-decoration: none;
      color: #ced4da;
      font-size: 16px;
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
      display: flex;
      align-items: center;
    }

    .admin-nav a:hover {
      background-color: #495057;
      color: #fff;
      border-left-color: #6c757d;
    }

    .admin-nav a.active {
      background-color: #495057;
      color: #fff;
      border-left-color: #007bff;
    }

    .nav-icon {
      margin-right: 10px;
      font-size: 18px;
    }

    .admin-content {
      padding: 25px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin: 20px;
      overflow: auto;
    }
  `]
})
export class AdminDashboardComponent {}

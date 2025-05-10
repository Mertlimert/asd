import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './components/product-management/product-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { OrderManagementComponent } from './components/order-management/order-management.component';
import { ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'products', component: ProductManagementComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'orders', component: OrderManagementComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ]
})
export class AdminModule { }
import { Routes } from '@angular/router';
import { SellerDashboardComponent } from './components/seller-dashboard/seller-dashboard.component';
import { SellerProductListComponent } from './components/seller-product-list/seller-product-list.component';
import { SellerProductFormComponent } from './components/seller-product-form/seller-product-form.component';
import { SellerOrdersComponent } from './components/seller-orders/seller-orders.component';

export const SELLER_ROUTES: Routes = [
  {
    path: '',
    component: SellerDashboardComponent,
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'products', component: SellerProductListComponent },
      { path: 'create', component: SellerProductFormComponent },
      { path: 'edit/:id', component: SellerProductFormComponent },
      { path: 'orders', component: SellerOrdersComponent }
    ]
  }
];
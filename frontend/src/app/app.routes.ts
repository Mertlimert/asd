import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { CheckoutAddressComponent } from './features/cart/checkout-address/checkout-address.component';
import { CheckoutPaymentComponent } from './features/cart/checkout-payment/checkout-payment.component';
import { CheckoutConfirmationComponent } from './features/cart/checkout-confirmation/checkout-confirmation.component';
import { CheckoutSuccessComponent } from './features/cart/checkout-success/checkout-success.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule)
  },
  {
    path: 'checkout',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'address', pathMatch: 'full' },
      { path: 'address', component: CheckoutAddressComponent },
      { path: 'payment', component: CheckoutPaymentComponent },
      { path: 'confirm', component: CheckoutConfirmationComponent },
      { path: 'success', component: CheckoutSuccessComponent }
    ]
  },
  {
    path: 'account',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: ProfileComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'orders', component: ProfileComponent, data: { section: 'orders' } },
      { path: 'addresses', component: ProfileComponent, data: { section: 'addresses' } }
    ]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'seller',
    loadChildren: () => import('./features/seller/seller.module').then(m => m.SellerModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'order-success',
    component: OrderSuccessComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

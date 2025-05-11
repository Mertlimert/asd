import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../../material.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SELLER_ROUTES } from './seller.routes';
import { SellerAnalyticsComponent } from './components/seller-analytics/seller-analytics.component';
import { SellerDashboardComponent } from './components/seller-dashboard/seller-dashboard.component';
import { SellerProductListComponent } from './components/seller-product-list/seller-product-list.component';
import { SellerProductFormComponent } from './components/seller-product-form/seller-product-form.component';
import { SellerOrdersComponent } from './components/seller-orders/seller-orders.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    NgxChartsModule,
    RouterModule.forChild(SELLER_ROUTES)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SellerModule { }

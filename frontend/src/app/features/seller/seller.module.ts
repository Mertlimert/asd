import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SELLER_ROUTES } from './seller.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(SELLER_ROUTES)
  ]
})
export class SellerModule { }
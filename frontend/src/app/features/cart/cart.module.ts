import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CartComponent } from './cart.component';
import { SharedModule } from '../../shared/shared.module';

// Sadece cart rotasını tanımlıyoruz, checkout rotaları app.routes.ts'de
const routes: Routes = [
  { path: '', component: CartComponent }
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,
    CartComponent, // Standalone olduğundan import ediyoruz
  ],
  exports: [RouterModule]
})
export class CartModule { }

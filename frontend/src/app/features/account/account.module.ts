import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from '../../components/profile/profile.component';
import { AuthGuard } from '../../guards/auth.guard';

// Account modülü için alt rotaları tanımlıyoruz
const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'orders',
    component: ProfileComponent,
    data: { section: 'orders' }
  },
  {
    path: 'addresses',
    component: ProfileComponent,
    data: { section: 'addresses' }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AccountModule { }

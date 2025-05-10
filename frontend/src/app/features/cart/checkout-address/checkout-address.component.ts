import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddressService, Address } from '../../../services/address.service';

@Component({
  selector: 'app-checkout-address',
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class CheckoutAddressComponent implements OnInit {
  addresses: Address[] = [];
  loading = false;
  error: string | null = null;
  selectedAddressId: number | null = null;
  sameBillingAddress = true;
  selectedBillingAddressId: number | null = null;
  showAddressForm = false;
  addressForm: FormGroup;

  constructor(
    private addressService: AddressService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.addressForm = this.fb.group({
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      addressName: ['', [Validators.required]],
      recipientName: ['', [Validators.required]],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.error = null;
    this.addressService.getUserAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;

        // Varsayılan adresi seçili olarak ayarla
        const defaultAddress = addresses.find(a => a.isDefault);
        if (defaultAddress && defaultAddress.id !== undefined) {
          this.selectedAddressId = defaultAddress.id;
        } else if (addresses.length > 0 && addresses[0].id !== undefined) {
          this.selectedAddressId = addresses[0].id;
        }
      },
      error: (err) => {
        this.error = err.message || 'Adresler yüklenirken bir hata oluştu';
        this.loading = false;
      }
    });
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
    if (this.showAddressForm) {
      this.addressForm.reset({
        isDefault: false
      });
    }
  }

  selectAddress(addressId: number): void {
    this.selectedAddressId = addressId;
  }

  selectBillingAddress(addressId: number): void {
    this.selectedBillingAddressId = addressId;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      Object.keys(this.addressForm.controls).forEach(key => {
        const control = this.addressForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const newAddress: Address = this.addressForm.value;

    this.addressService.createAddress(newAddress).subscribe({
      next: (address) => {
        this.addresses.push(address);
        this.selectedAddressId = address.id || null;
        this.loading = false;
        this.showAddressForm = false;
      },
      error: (err) => {
        this.error = err.message || 'Adres eklenirken bir hata oluştu';
        this.loading = false;
      }
    });
  }

  proceedToPayment(): void {
    if (!this.selectedAddressId) {
      this.error = 'Lütfen teslimat için bir adres seçin';
      return;
    }

    // Seçilen adres bilgilerini session storage'a kaydet
    const shippingAddress = this.addresses.find(a => a.id === this.selectedAddressId);
    if (shippingAddress) {
      sessionStorage.setItem('shippingAddressId', String(this.selectedAddressId));

      // Fatura adresi teslimat adresi ile aynı mı kontrol et
      if (this.sameBillingAddress) {
        sessionStorage.setItem('billingAddressId', String(this.selectedAddressId));
      } else if (this.selectedBillingAddressId) {
        sessionStorage.setItem('billingAddressId', String(this.selectedBillingAddressId));
      } else {
        sessionStorage.removeItem('billingAddressId');
      }

      // Doğru checkout path ile navigate et
      this.router.navigate(['/checkout/payment']);
    }
  }
}

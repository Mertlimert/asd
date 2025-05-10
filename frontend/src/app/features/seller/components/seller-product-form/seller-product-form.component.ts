import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="product-form-container">
      <div class="form-header">
        <h3>{{ isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle' }}</h3>
        <p class="form-subtitle">Ürün bilgilerini aşağıdaki forma girin</p>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Veriler yükleniyor...</p>
      </div>

      <div *ngIf="error" class="error-message">
        <div class="error-icon">⚠️</div>
        <div>
          <strong>Hata!</strong>
          <p>{{ error }}</p>
        </div>
      </div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" *ngIf="!loading" class="product-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Ürün Adı</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              placeholder="Ürün adını girin"
              [class.is-invalid]="submitted && f['name'].errors"
            >
            <div class="validation-error" *ngIf="submitted && f['name'].errors">
              <div *ngIf="f['name'].errors['required']">Ürün adı gereklidir</div>
            </div>
          </div>

          <div class="form-group">
            <label for="price">Fiyat (₺)</label>
            <div class="price-input-wrapper">
              <span class="price-symbol">₺</span>
              <input
                type="number"
                id="price"
                formControlName="price"
                min="0"
                step="0.01"
                [class.is-invalid]="submitted && f['price'].errors"
              >
            </div>
            <div class="validation-error" *ngIf="submitted && f['price'].errors">
              <div *ngIf="f['price'].errors['required']">Fiyat gereklidir</div>
              <div *ngIf="f['price'].errors['min']">Fiyat 0'dan büyük veya eşit olmalıdır</div>
            </div>
          </div>

          <div class="form-group">
            <label for="stock_quantity">Stok Miktarı</label>
            <input
              type="number"
              id="stock_quantity"
              formControlName="stock_quantity"
              min="0"
              step="1"
              [class.is-invalid]="submitted && f['stock_quantity'].errors"
            >
            <div class="validation-error" *ngIf="submitted && f['stock_quantity'].errors">
              <div *ngIf="f['stock_quantity'].errors['required']">Stok miktarı gereklidir</div>
              <div *ngIf="f['stock_quantity'].errors['min']">Stok miktarı 0'dan büyük veya eşit olmalıdır</div>
            </div>
          </div>

          <div class="form-group">
            <label for="category_id">Kategori</label>
            <select
              id="category_id"
              formControlName="category_id"
              [class.is-invalid]="submitted && f['category_id'].errors"
            >
              <option [value]="null">-- Kategori Seçin --</option>
              <option *ngFor="let category of categories" [value]="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label for="description">Ürün Açıklaması</label>
          <textarea
            id="description"
            formControlName="description"
            rows="6"
            placeholder="Ürün açıklamasını girin"
          ></textarea>
        </div>

        <div class="form-group full-width">
          <label for="image_url">Görsel URL</label>
          <input
            type="text"
            id="image_url"
            formControlName="image_url"
            placeholder="Ürün görseli için URL girin"
          >
          <div class="image-preview" *ngIf="productForm.value.image_url">
            <img [src]="productForm.value.image_url" alt="Ürün önizlemesi">
          </div>
        </div>

        <div class="form-actions">
          <button type="button" (click)="goBack()" class="btn btn-cancel">
            <i class="btn-icon">❌</i> İptal
          </button>
          <button type="submit" class="btn btn-save" [class.saving]="saving">
            <i class="btn-icon" *ngIf="!saving">💾</i>
            <div class="btn-spinner" *ngIf="saving"></div>
            {{ saving ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Ürün Ekle') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .form-header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .form-header h3 {
      margin: 0 0 5px;
      font-size: 24px;
      font-weight: 500;
      color: #333;
    }

    .form-subtitle {
      color: #666;
      margin: 0;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      position: relative;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    input, textarea, select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: all 0.3s ease;
      color: #333;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }

    .price-input-wrapper {
      position: relative;
    }

    .price-symbol {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    input#price {
      padding-left: 30px;
    }

    .is-invalid {
      border-color: #f44336;
    }

    .is-invalid:focus {
      border-color: #f44336;
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.2);
    }

    .validation-error {
      color: #f44336;
      font-size: 14px;
      margin-top: 5px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }

    .btn-spinner {
      display: inline-block;
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid #fff;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      display: flex;
      background-color: #ffebee;
      color: #c62828;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      align-items: center;
    }

    .error-icon {
      font-size: 24px;
      margin-right: 15px;
    }

    .image-preview {
      margin-top: 10px;
      border: 1px solid #ddd;
      padding: 5px;
      border-radius: 4px;
      background-color: #f9f9f9;
      text-align: center;
    }

    .image-preview img {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }

    .btn-cancel {
      background-color: #f5f5f5;
      color: #333;
    }

    .btn-cancel:hover {
      background-color: #e0e0e0;
    }

    .btn-save {
      background-color: #4CAF50;
      color: white;
      min-width: 140px;
    }

    .btn-save:hover {
      background-color: #45a049;
    }

    .btn-save.saving {
      background-color: #388e3c;
      cursor: not-allowed;
    }

    .btn-icon {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .product-form-container {
        padding: 20px;
        margin: 0 10px;
      }
    }
  `]
})
export class SellerProductFormComponent implements OnInit {
  productForm!: FormGroup;
  categories: Category[] = [];
  isEditMode: boolean = false;
  productId?: number;
  loading: boolean = false;
  saving: boolean = false;
  submitted: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.productForm.controls; }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock_quantity: [0, [Validators.required, Validators.min(0)]],
      image_url: [''],
      category_id: [null]
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        this.error = 'Kategoriler yüklenemedi';
        console.error(err);
      }
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Ürün yüklenemedi';
        this.loading = false;
        console.error(err);
      }
    });
  }

  populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_id: product.category?.id || null
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.productForm.invalid) {
      return;
    }

    this.saving = true;
    this.error = null;

    const product: Product = {
      ...this.productForm.value,
      id: this.isEditMode ? this.productId : undefined
    };

    if (this.isEditMode) {
      this.updateProduct(product);
    } else {
      this.createProduct(product);
    }
  }

  createProduct(product: Product): void {
    console.log('Creating product with data:', product);
    this.productService.createProduct(product).subscribe({
      next: (createdProduct) => {
        console.log('Product created successfully:', createdProduct);
        this.saving = false;
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        console.error('Error details:', err);
        // Extract the detailed error message if available
        const errorMessage = err.error?.message || err.error?.error || err.message || 'Ürün oluşturulamadı';
        this.error = errorMessage;
        this.saving = false;
      }
    });
  }

  updateProduct(product: Product): void {
    console.log('Updating product with data:', product);
    this.productService.updateProduct(product).subscribe({
      next: (updatedProduct) => {
        console.log('Product updated successfully:', updatedProduct);
        this.saving = false;
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        console.error('Error details:', err);
        // Extract the detailed error message if available
        const errorMessage = err.error?.message || err.error?.error || err.message || 'Ürün güncellenemedi';
        this.error = errorMessage;
        this.saving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/seller/products']);
  }
}

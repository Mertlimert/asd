import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="product-management-container">
      <div class="header-section">
        <h2>Ürün Yönetimi</h2>
        <button class="add-button" (click)="createProduct()">
          <i class="btn-icon">➕</i> Yeni Ürün Ekle
        </button>
      </div>

      <div *ngIf="editingProduct" class="edit-form-container">
        <div class="card">
          <div class="card-header">
            <h3>{{ editingProduct.id ? 'Ürün Düzenle' : 'Yeni Ürün' }}</h3>
          </div>
          <div class="card-body">
            <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
              <div class="form-grid">
                <div class="form-group">
                  <label for="name">Ürün Adı</label>
                  <input
                    type="text"
                    id="name"
                    formControlName="name"
                    class="form-control"
                    [class.is-invalid]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
                  >
                  <div class="validation-error" *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched">
                    Ürün adı gereklidir
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
                      class="form-control"
                      step="0.01"
                      [class.is-invalid]="productForm.get('price')?.invalid && productForm.get('price')?.touched"
                    >
                  </div>
                  <div class="validation-error" *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched">
                    Geçerli bir fiyat girin
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="description">Açıklama</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="4"
                  placeholder="Ürün açıklaması girin"
                ></textarea>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label for="image_url">Görsel URL</label>
                  <input
                    type="text"
                    id="image_url"
                    formControlName="image_url"
                    class="form-control"
                    placeholder="Görsel URL'si girin"
                  >
                </div>

                <div class="form-group">
                  <label for="stock_quantity">Stok Miktarı</label>
                  <input
                    type="number"
                    id="stock_quantity"
                    formControlName="stock_quantity"
                    class="form-control"
                    min="0"
                    [class.is-invalid]="productForm.get('stock_quantity')?.invalid && productForm.get('stock_quantity')?.touched"
                  >
                  <div class="validation-error" *ngIf="productForm.get('stock_quantity')?.invalid && productForm.get('stock_quantity')?.touched">
                    Geçerli bir stok miktarı girin
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="category_id">Kategori</label>
                <select
                  id="category_id"
                  formControlName="category_id"
                  class="form-control"
                  [class.is-invalid]="productForm.get('category_id')?.invalid && productForm.get('category_id')?.touched"
                >
                  <option [ngValue]="null">Kategori Seçin</option>
                  <option *ngFor="let category of categories" [ngValue]="category.id">
                    {{category.name}}
                  </option>
                </select>
                <div class="validation-error" *ngIf="productForm.get('category_id')?.invalid && productForm.get('category_id')?.touched">
                  Kategori seçimi gereklidir
                </div>
              </div>

              <div *ngIf="productForm.value.image_url" class="image-preview">
                <img [src]="productForm.value.image_url" alt="Ürün önizleme">
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-cancel" (click)="cancelEdit()">
                  <i class="action-icon">❌</i> İptal
                </button>
                <button type="submit" class="btn btn-save" [disabled]="productForm.invalid || isSaving">
                  <i class="action-icon" *ngIf="!isSaving">💾</i>
                  <div class="spinner" *ngIf="isSaving"></div>
                  <span>{{ isSaving ? 'Kaydediliyor...' : (editingProduct.id ? 'Güncelle' : 'Kaydet') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="card products-table-card">
        <div class="card-body">
          <table class="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Görsel</th>
                <th>Ürün Adı</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>Kategori</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of products">
                <td>{{product.id}}</td>
                <td class="product-image-cell">
                  <div class="product-thumbnail" *ngIf="product.image_url">
                    <img [src]="product.image_url" alt="{{product.name}}">
                  </div>
                  <div class="no-image" *ngIf="!product.image_url">
                    <i class="no-image-icon">🖼️</i>
                  </div>
                </td>
                <td class="product-name-cell">{{product.name}}</td>
                <td class="price-cell">{{product.price | currency:'₺'}}</td>
                <td [class.low-stock]="product.stock_quantity < 10">
                  {{product.stock_quantity}}
                  <span class="stock-status" *ngIf="product.stock_quantity < 10">Düşük Stok</span>
                </td>
                <td>{{getCategoryName(product.category_id)}}</td>
                <td class="action-buttons">
                  <button (click)="editProduct(product)" class="btn-icon-action btn-edit" title="Düzenle">
                    <i class="action-icon">✏️</i>
                  </button>
                  <button (click)="deleteProduct(product)" class="btn-icon-action btn-delete" [disabled]="!product.id" title="Sil">
                    <i class="action-icon">🗑️</i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="products.length === 0">
                <td colspan="7" class="no-products">
                  Henüz ürün bulunmuyor. "Yeni Ürün Ekle" butonuna tıklayarak ürün ekleyebilirsiniz.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-management-container {
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-section h2 {
      margin: 0;
      color: #333;
      font-size: 26px;
      font-weight: 500;
    }

    .add-button {
      display: flex;
      align-items: center;
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .add-button:hover {
      background-color: #45a049;
    }

    .btn-icon {
      margin-right: 8px;
    }

    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .card-header {
      background-color: #f8f9fa;
      padding: 16px 24px;
      border-bottom: 1px solid #e9ecef;
    }

    .card-header h3 {
      margin: 0;
      color: #495057;
      font-size: 18px;
      font-weight: 500;
    }

    .card-body {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #495057;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      font-size: 15px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .form-control:focus {
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .is-invalid {
      border-color: #dc3545;
    }

    .is-invalid:focus {
      border-color: #dc3545;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .validation-error {
      color: #dc3545;
      font-size: 13px;
      margin-top: 5px;
    }

    .price-input-wrapper {
      position: relative;
    }

    .price-symbol {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #495057;
    }

    input#price {
      padding-left: 24px;
    }

    .image-preview {
      margin-top: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
      overflow: hidden;
      max-width: 300px;
    }

    .image-preview img {
      width: 100%;
      height: auto;
      display: block;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 24px;
      font-size: 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .btn-cancel {
      background-color: #f8f9fa;
      color: #495057;
      border: 1px solid #ced4da;
    }

    .btn-cancel:hover {
      background-color: #e9ecef;
    }

    .btn-save {
      background-color: #007bff;
      color: white;
    }

    .btn-save:hover {
      background-color: #0069d9;
    }

    .btn-save:disabled {
      background-color: #7abaff;
      cursor: not-allowed;
    }

    .action-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .products-table-card {
      margin-top: 30px;
    }

    .products-table {
      width: 100%;
      border-collapse: collapse;
    }

    .products-table th,
    .products-table td {
      padding: 12px 16px;
      text-align: left;
      vertical-align: middle;
      border-bottom: 1px solid #e9ecef;
    }

    .products-table thead tr {
      background-color: #f8f9fa;
      color: #495057;
    }

    .products-table tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.025);
    }

    .product-image-cell {
      width: 60px;
    }

    .product-thumbnail {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-thumbnail img {
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #adb5bd;
    }

    .no-image-icon {
      font-size: 18px;
    }

    .product-name-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price-cell {
      font-weight: 500;
      color: #212529;
    }

    .low-stock {
      color: #dc3545;
    }

    .stock-status {
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      background-color: #dc3545;
      padding: 2px 6px;
      border-radius: 20px;
      margin-left: 6px;
    }

    .action-buttons {
      white-space: nowrap;
      display: flex;
      gap: 8px;
    }

    .btn-icon-action {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-edit {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .btn-edit:hover {
      background-color: #bbdefb;
    }

    .btn-delete {
      background-color: #ffebee;
      color: #c62828;
    }

    .btn-delete:hover {
      background-color: #ffcdd2;
    }

    .btn-icon-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-products {
      text-align: center;
      padding: 40px;
      color: #6c757d;
    }

    @media (max-width: 992px) {
      .form-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .product-name-cell {
        max-width: 150px;
      }
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .card-body {
        padding: 16px;
      }

      .products-table {
        display: block;
        overflow-x: auto;
      }

      .product-name-cell {
        max-width: 120px;
      }

      .action-buttons {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  editingProduct: Product | null = null;
  productForm: FormGroup;
  isSaving = false;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  private createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      image_url: [''],
      stock_quantity: ['', [Validators.required, Validators.min(0)]],
      category_id: [null, [Validators.required]]
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(
      products => {
        this.products = products;
      }
    );
  }

  loadCategories() {
    this.productService.getCategories().subscribe(
      categories => this.categories = categories
    );
  }

  getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return 'Kategori Yok';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Bilinmeyen Kategori';
  }

  createProduct() {
    this.editingProduct = {} as Product;
    this.productForm.reset({
      price: 0,
      stock_quantity: 0,
      category_id: null
    });
  }

  editProduct(product: Product) {
    this.editingProduct = { ...product };

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id !== undefined ? Number(product.category_id) : null
    });
  }

  cancelEdit() {
    this.editingProduct = null;
    this.productForm.reset();
  }

  saveProduct() {
    if (this.productForm.invalid || !this.editingProduct) {
      return;
    }

    this.isSaving = true;

    const formValues = this.productForm.value;
    const productData: Product = {
      id: this.editingProduct.id,
      name: formValues.name,
      description: formValues.description,
      price: Number(formValues.price),
      image_url: formValues.image_url,
      stock_quantity: Number(formValues.stock_quantity),
      category_id: formValues.category_id !== undefined && formValues.category_id !== null
        ? Number(formValues.category_id)
        : null
    };

    const request = productData.id
      ? this.productService.updateProduct(productData)
      : this.productService.createProduct(productData);

    request.subscribe({
      next: () => {
        this.loadProducts();
        this.editingProduct = null;
        this.productForm.reset();
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  deleteProduct(product: Product) {
    if (!product.id) return;

    if (confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-seller-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seller-products">
      <div class="header-section">
        <h3>My Products</h3>
        <button class="add-product-btn" (click)="navigateToCreate()">
          <i class="btn-icon">➕</i> Add New Product
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading products...</p>
      </div>

      <div *ngIf="error" class="error-container">
        <i class="error-icon">⚠️</i>
        <p>{{ error }}</p>
      </div>

      <div *ngIf="!loading && !error && products.length === 0" class="no-products">
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h4>No Products Yet</h4>
          <p>You don't have any products to sell yet.</p>
          <button (click)="navigateToCreate()">Create your first product</button>
        </div>
      </div>

      <div class="product-grid" *ngIf="products.length > 0">
        <div class="product-card" *ngFor="let product of products">
          <div class="product-image">
            <img [src]="product.image_url || 'assets/placeholder.png'" alt="{{ product.name }}">
          </div>
          <div class="product-details">
            <h4>{{ product.name }}</h4>
            <div class="product-info">
              <span class="price">{{ product.price | currency }}</span>
              <span class="stock" [class.low-stock]="product.stock_quantity < 10">
                {{ product.stock_quantity }} in stock
              </span>
            </div>
            <div class="product-category">
              <span>{{ product.category?.name || 'No Category' }}</span>
            </div>
          </div>
          <div class="product-actions">
            <button (click)="editProduct(product)" class="edit-btn">Edit</button>
            <button (click)="deleteProduct(product)" class="delete-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-products {
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eaeaea;
    }

    .header-section h3 {
      font-size: 24px;
      margin: 0;
      color: #333;
    }

    .add-product-btn {
      display: flex;
      align-items: center;
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .add-product-btn:hover {
      background-color: #45a049;
    }

    .btn-icon {
      margin-right: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      padding: 16px;
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .error-icon {
      font-size: 24px;
      margin-right: 12px;
    }

    .no-products {
      padding: 40px 0;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      max-width: 500px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      font-size: 20px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 20px;
    }

    .empty-state button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .empty-state button:hover {
      background-color: #45a049;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .product-card {
      border: 1px solid #eaeaea;
      border-radius: 8px;
      overflow: hidden;
      transition: box-shadow 0.3s, transform 0.3s;
    }

    .product-card:hover {
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transform: translateY(-3px);
    }

    .product-image {
      height: 180px;
      overflow: hidden;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }

    .product-details {
      padding: 16px;
    }

    .product-details h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .price {
      font-weight: bold;
      color: #333;
    }

    .stock {
      color: #4CAF50;
    }

    .low-stock {
      color: #ff9800;
    }

    .product-category {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }

    .product-actions {
      display: flex;
      padding: 8px 16px 16px;
      gap: 8px;
    }

    .edit-btn, .delete-btn {
      flex: 1;
      padding: 8px 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .edit-btn {
      background-color: #2196F3;
      color: white;
    }

    .edit-btn:hover {
      background-color: #0b7dda;
    }

    .delete-btn {
      background-color: #f44336;
      color: white;
    }

    .delete-btn:hover {
      background-color: #d32f2f;
    }

    @media (max-width: 600px) {
      .product-grid {
        grid-template-columns: 1fr;
      }

      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class SellerProductListComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getSellerProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load products';
        this.loading = false;
      }
    });
  }

  editProduct(product: Product): void {
    this.router.navigate(['/seller/edit', product.id]);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id!).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete product';
        }
      });
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/seller/create']);
  }
}

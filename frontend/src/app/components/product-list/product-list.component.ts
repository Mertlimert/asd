import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Category } from '../../models/category.model';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  originalProducts: Product[] = [];
  searchTerm: string = '';
  selectedSeller: string = '';
  sortOption: string = 'nameAsc';
  sellers: string[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    // Subscribe to query parameter changes for search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.applyFilters();
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.originalProducts = [...data];
        this.extractSellersList();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  extractSellersList(): void {
    // Ürünlerdeki benzersiz satıcıları çıkar
    const uniqueSellers = new Set<string>();
    this.originalProducts.forEach(product => {
      if (product.seller && product.seller.username) {
        uniqueSellers.add(product.seller.username);
      }
    });
    this.sellers = Array.from(uniqueSellers);
  }

  selectCategory(category: Category | null, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.selectedCategory = category;

    if (category) {
      this.productService.getProductsByCategory(category.id).subscribe({
        next: (products) => {
          this.products = products;
          this.originalProducts = [...products];
          this.extractSellersList();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading products for category:', error);
          // Fallback to all products if there's an error
          this.loadProducts();
        }
      });
    } else {
      this.loadProducts();
    }
  }

  applyFilters(): void {
    let filtered = [...this.originalProducts];

    // Arama terimiyle filtreleme
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.description?.toLowerCase().includes(term) ?? false)
      );
    }

    // Satıcıya göre filtreleme
    if (this.selectedSeller) {
      filtered = filtered.filter(product =>
        product.seller?.username === this.selectedSeller
      );
    }

    // Sıralama
    switch (this.sortOption) {
      case 'nameAsc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSellerChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  addToCart(product: Product): void {
    if (!product || product.id === undefined) {
      console.error('Cannot add product without ID to cart:', product);
      this.alertService.error('Could not add product to cart. Product information is missing.');
      return;
    }

    this.cartService.addToCart(product).subscribe({
      next: (cart) => {
        this.alertService.success(`'${product.name}' added to cart successfully!`);
      },
      error: (error) => {
        console.error('Error adding product to cart:', error);
        const message = error?.error?.message || error?.message || 'Please try again.';
        this.alertService.error(`Failed to add product to cart: ${message}`);
      }
    });
  }
}

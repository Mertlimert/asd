import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="category-management">
      <h2>Category Management</h2>
      <button class="add-button" (click)="createCategory()">Add New Category</button>
      <div class="category-form" *ngIf="editingCategory">
        <h3>{{ editingCategory.id ? 'Edit Category' : 'Create Category' }}</h3>
        <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" formControlName="name">
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description"></textarea>
          </div>
          
          <div class="button-group">
            <button type="submit" [disabled]="categoryForm.invalid || isSaving">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <div class="category-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of categories">
              <td>{{category.id}}</td>
              <td>{{category.name}}</td>
              <td>{{category.description}}</td>
              <td>
                <button (click)="editCategory(category)">Edit</button>
                <button (click)="deleteCategory(category)" [disabled]="!category.id">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .category-management {
      width: 100%;
    }
    .category-form {
      background: white;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input[type="text"],
    .form-group textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .form-group textarea {
      height: 100px;
      resize: vertical;
    }
    .button-group {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .add-button {
      margin-bottom: 20px;
      float: right;
      margin-right: 20px;
      background-color: rgb(23, 222, 123);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    button {
      margin: 0 5px;
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button:first-child {
      background-color: #007bff;
      color: white;
    }
    button:last-child {
      background-color: #dc3545;
      color: white;
    }
  `]
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  editingCategory: Category | null = null;
  categoryForm: FormGroup;
  isSaving = false;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.createCategoryForm();
  }

  ngOnInit() {
    this.loadCategories();
  }

  private createCategoryForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: ['']
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(
      categories => this.categories = categories
    );
  }

  createCategory() {
    this.editingCategory = {} as Category;
    this.categoryForm.reset();
  }

  editCategory(category: Category) {
    this.editingCategory = { ...category };
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
  }

  cancelEdit() {
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  saveCategory() {
    if (this.categoryForm.invalid || !this.editingCategory) return;
    
    this.isSaving = true;
    const categoryData = { ...this.editingCategory, ...this.categoryForm.value };
    
    const request = categoryData.id
      ? this.categoryService.updateCategory(categoryData)
      : this.categoryService.createCategory(categoryData);

    request.subscribe({
      next: () => {
        this.loadCategories();
        this.editingCategory = null;
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  deleteCategory(category: Category) {
    if (!category.id) return;
    
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
        }
      });
    }
  }
}
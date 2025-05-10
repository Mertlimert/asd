import { Product } from './product.model';

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
  addedAt?: string;
  subtotal?: number;
}

export interface Cart {
  id?: number;
  userId?: number;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
  totalPrice?: number;
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../models/cart-item.model';

@Component({
  selector: 'app-cart-item',
  templateUrl: './cart-item.component.html',
  styleUrls: ['./cart-item.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CartItemComponent {
  @Input() item!: CartItem;
  @Output() updateQuantity = new EventEmitter<number>();
  @Output() removeItem = new EventEmitter<void>();
  @Output() stockExceeded = new EventEmitter<string>();

  incrementQuantity(): void {
    if (!this.item.product) {
      this.stockExceeded.emit('Ürün bilgisi bulunamadı.');
      return;
    }

    if (this.item.quantity >= this.item.product.stock_quantity) {
      this.stockExceeded.emit(`Stok sınırına ulaşıldı: Bu üründen en fazla ${this.item.product.stock_quantity} adet ekleyebilirsiniz.`);
      return;
    }

    // Stok sınırını aşmadıysa miktarı artır
    this.updateQuantity.emit(this.item.quantity + 1);
  }

  decrementQuantity(): void {
    if (this.item.quantity > 1) {
      this.updateQuantity.emit(this.item.quantity - 1);
    } else {
      this.removeItem.emit();
    }
  }

  onRemove(): void {
    this.removeItem.emit();
  }
}

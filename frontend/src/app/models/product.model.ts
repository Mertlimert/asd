import { Review } from './review.model';

export interface Product {
    id?: number;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    created_at?: Date;
    category_id: number | null | undefined;
    category?: {
        id: number;
        name: string;
        description?: string;
    };
    seller?: {
        id: number;
        username: string;
        email?: string;
        firstName?: string;
        lastName?: string;
    };
    seller_id?: number;
    reviews?: Review[];
    averageRating?: number;
    reviewCount?: number;
}
export interface Review {
    id?: number;
    productId: number;
    userId: number;
    rating: number; // 1-5 stars
    comment: string;
    createdAt?: Date;
    user?: {
        id: number;
        username: string;
        firstName?: string;
        lastName?: string;
    };
}
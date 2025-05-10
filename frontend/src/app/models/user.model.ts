export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export interface User {
  id?: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  role: UserRole;
  banned: boolean;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  banned: boolean;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

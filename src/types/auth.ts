// Define a simple Guid type to avoid template literal type errors
export type Guid = number;
export type UserRole = 'ADMIN' | 'ADVERTISER' | 'AGENCY_MANAGER';

export interface User {
  id: Guid;
  advertiserId: Guid;
  sellerId: Guid;
  tenantId: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  phoneNumber: string;
  address: string;
  agencyId?: Guid | null;
  shopName: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

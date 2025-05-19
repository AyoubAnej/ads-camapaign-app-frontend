// Ad related types
import { StateObject, BidObject } from './campaign';

// Pagination types
export interface PaginationResponse<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
}

export interface AdPaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string;
}

// DTOs for Ad Service
export interface CreateAdRequestDto {
  productId: string;
  title: string;
  description: string;
  mediaUrl: string;
  redirectUrl: string;
  adState: StateObject;
  bid: BidObject;
}

export interface UpdateAdRequestDto {
  title?: string;
  description?: string;
  mediaUrl?: string;
  redirectUrl?: string;
  adState?: StateObject;
  bid?: BidObject;
}

export interface GetAdResponseDto {
  adId: number;
  campaignId: number;
  productId: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  redirectUrl?: string;
  adState?: StateObject;
  bid: BidObject;
  creationDate: string;
  updateDate: string;
  globalState?: StateObject;
}

export interface SelectedProductsRequestDto {
  productIds: string[];
  defaultBidAmount: number;
}

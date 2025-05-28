// Campaign related types
export enum GlobalState {
  OK = "OK",
  DISABLED = "DISABLED"
}

export enum StateType {
  OK = 0,
  DISABLED = 1,
  OUT_OF_STOCK = 2
}

export enum CampaignType {
  SPONSORED = "SPONSORED",
  SPONSOREDPLUS = "SPONSOREDPLUS",
  HEADLINE = "HEADLINE"
}

export enum BidStrategy {
  MANUAL = 0
}

export enum BidType {
  CPC = 0
}

// Helper function to convert enum string to display string
export const getGlobalStateString = (state: GlobalState | string): string => {
  if (state === GlobalState.OK) return 'OK';
  if (state === GlobalState.DISABLED) return 'DISABLED';
  return state as string || 'UNKNOWN';
};

export const getStateTypeString = (state: StateType): string => {
  switch(state) {
    case StateType.OK: return 'OK';
    case StateType.DISABLED: return 'DISABLED';
    case StateType.OUT_OF_STOCK: return 'OUT_OF_STOCK';
    default: return 'UNKNOWN';
  }
};

export const getCampaignTypeString = (type: CampaignType | string): string => {
  if (type === CampaignType.SPONSORED) return 'SPONSORED';
  if (type === CampaignType.SPONSOREDPLUS) return 'SPONSOREDPLUS';
  if (type === CampaignType.HEADLINE) return 'HEADLINE';
  return type as string || 'UNKNOWN';
};

export interface StateObject {
  isActive: boolean;
  activatedAt?: string | null;
  deactivatedAt?: string | null;
  reason?: string;
}

export interface BidObject {
  amount: number;
  currency: string;
  strategy: string;
}

export interface PlacementObject {
  strategy: string;
}

// AdsSpaceObject has been removed as it's now obsolete

// DTOs for Campaign Service
export interface CreateCampaignRequestDto {
  campaignName: string;
  campaignStartDate: Date;
  campaignEndDate?: Date | null;
  globalState: GlobalState;
  tenantId: number;
  campaignType: CampaignType;
  ownerActivation?: StateObject;
  bid?: BidObject;
}

export interface UpdateCampaignRequestDto {
  campaignName: string;
  campaignStartDate: Date;
  campaignEndDate?: Date | null;
  globalState: GlobalState;
  campaignType: CampaignType;
  ownerActivation?: StateObject;
  bid?: BidObject;
}

export interface GetCampaignResponseDto {
  campaignId: number;
  campaignName: string;
  campaignStartDate: string;
  campaignEndDate?: string | null;
  globalState: GlobalState;
  tenantId: number;
  campaignType: CampaignType;
  ownerActivation?: StateObject;
  bid?: BidObject;
  creationDate: string;
  updateDate: string;
}

// Pagination
export interface PaginationResponseDto<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
}

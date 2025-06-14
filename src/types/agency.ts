
export enum AgencyStatus {
  ACTIVE = 0,
  INACTIVE = 1
}

// Helper functions for status conversion
export const agencyStatusToString = (status: AgencyStatus): string => {
  switch (status) {
    case AgencyStatus.ACTIVE:
      return 'ACTIVE';
    case AgencyStatus.INACTIVE:
      return 'INACTIVE';
    default:
      return 'UNKNOWN';
  }
};

export interface Agency {
  agencyId: number;
  name: string;
  phoneNumber: string;
  website?: string;
  description?: string;
  status: AgencyStatus;
  createdAt: string;
  updatedAt: string;
  deactivatedAt?: string;
  deactivationReason?: string;
  managerId?: number; // ID of the agency manager user
}

export interface CreateAgencyDto {
  name: string;
  phoneNumber: string;
  website?: string;
  description?: string;
}

export interface UpdateAgencyDto {
  name: string;
  phoneNumber: string;
  website?: string;
  description?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

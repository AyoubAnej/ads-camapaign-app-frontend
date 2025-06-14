export type NotificationType = 'Created' | 'Updated' | 'Deactivated' | 'Reactivated' | 'Deleted' | 'AdminUpdated' | 'AgencyManagerUpdated';

/**
 * Notification interface that matches the .NET Core backend InAppNotification model
 */
export interface Notification {
  id: number;
  advertiserId: number; // Maps to the backend's AdvertiserId property
  userId?: number; // Optional userId for identifying which user the notification belongs to (for frontend use)
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string; // Maps to the backend's CreatedAt property
  agencyId?: number; // Optional agency ID for filtering by agency (for frontend use)
  adminId?: number; // Optional admin ID for admin notifications
}

export interface NotificationResponse {
  items: Notification[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationFilter {
  includeRead?: boolean;
  page?: number;
  pageSize?: number;
  userId?: number; // Filter notifications by specific user ID
  agencyId?: number; // Filter notifications by agency ID for AGENCY_MANAGER role
}

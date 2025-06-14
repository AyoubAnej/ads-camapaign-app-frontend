import axios from 'axios';
import { Notification, NotificationFilter, NotificationResponse, NotificationType } from '@/types/notification';
import { decodeJWT } from './jwtHelper';

// Create notification axios instance
export const notificationAxios = axios.create({
  baseURL: 'http://localhost:5000/api/v1/Notifications',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add response interceptor to log all responses for debugging
notificationAxios.interceptors.response.use(
  (response) => {
    console.log('Notification API Response:', response);
    return response;
  },
  (error) => {
    console.error('Notification API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Add request interceptor for authentication
notificationAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptors for error handling
notificationAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Notification API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Notification API service that matches the .NET Core backend endpoints
 */
export const notificationApi = {
  /**
   * Get notifications for a specific user/advertiser
   * @param advertiserId - The ID of the advertiser/user
   * @param includeRead - Whether to include read notifications (default: false)
   */
  getNotificationsForUser: async (advertiserId: number, includeRead: boolean = false): Promise<Notification[]> => {
    const response = await notificationAxios.get(`/user/${advertiserId}`, {
      params: { includeRead }
    });
    return response.data;
  },

  /**
   * Get unread notification count for a specific user/advertiser
   * @param advertiserId - The ID of the advertiser/user
   */
  getUnreadCount: async (advertiserId: number): Promise<number> => {
    const response = await notificationAxios.get(`/user/${advertiserId}/unread-count`);
    return response.data;
  },

  /**
   * Mark a notification as read
   * @param notificationId - The ID of the notification to mark as read
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    await notificationAxios.put(`/${notificationId}/mark-read`);
  },

  /**
   * Delete a notification
   * @param notificationId - The ID of the notification to delete
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    await notificationAxios.delete(`/${notificationId}`);
  },

  /**
   * Get paginated notifications with filtering options
   * This is a custom method that adapts the backend API to support pagination and filtering
   * @param filter - Filter options including pagination parameters
   */
  /**
   * Create a notification for a user
   * @param userId - The ID of the user to create a notification for
   * @param message - The notification message
   * @param type - The notification type
   * @param agencyId - Optional agency ID for agency-related notifications
   * @param adminId - Optional admin ID for admin-related notifications
   */
  createNotification: async (userId: number, message: string, type: NotificationType, agencyId?: number, adminId?: number): Promise<Notification> => {
    try {
      const notificationData = {
        advertiserId: userId, // Backend expects advertiserId
        message,
        type,
        agencyId,
        adminId
      };
      
      const response = await notificationAxios.post('', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  getPaginatedNotifications: async (filter: NotificationFilter): Promise<NotificationResponse> => {
    try {
      // Extract filter parameters
      const { includeRead = true, page = 1, pageSize = 10, userId, agencyId } = filter;
      
      // Determine which endpoint to use based on filter parameters
      let endpoint = '';
      let params: Record<string, any> = { includeRead, page, pageSize };
      
      // Get current user ID from JWT token if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = decodeJWT(token);
            // Extract user ID from token claims
            const nameIdentifier = 
              decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
              decoded.nameid || 
              decoded.sub || 
              decoded.NameIdentifier;
            
            if (nameIdentifier) {
              currentUserId = typeof nameIdentifier === 'number' ? nameIdentifier : parseInt(nameIdentifier, 10);
            }
          } catch (error) {
            console.error('Error extracting user ID from token:', error);
          }
        }
      }
      
      if (!currentUserId) {
        console.error('No user ID available for fetching notifications');
        throw new Error('User ID is required to fetch notifications');
      }
      
      // All users fetch their own notifications using the /user/{advertiserId} endpoint
      endpoint = `/user/${currentUserId}`;
      console.log(`Fetching notifications for user ID: ${currentUserId}`);
      
      // Filter by agencyId if needed (will be done client-side after fetching)
      if (agencyId) {
        console.log(`Will filter notifications for agency ID: ${agencyId}`);
      }
      
      console.log(`API Request: ${endpoint}`, params);
      const response = await notificationAxios.get(endpoint, { params });
      console.log('API Response:', response.data);
      
      // If the backend doesn't return paginated data, we need to adapt it
      if (Array.isArray(response.data)) {
        // Backend returned an array, we need to paginate it manually
        const notifications = response.data as Notification[];
        console.log(`Received ${notifications.length} notifications from backend`);
        
        // Filter by agencyId if needed (client-side filtering)
        const filteredNotifications = agencyId 
          ? notifications.filter(n => n.agencyId === agencyId)
          : notifications;
          
        const totalCount = filteredNotifications.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = filteredNotifications.slice(startIndex, endIndex);
        
        console.log(`Returning ${paginatedItems.length} paginated notifications`);
        return {
          items: paginatedItems,
          totalCount,
          pageNumber: page,
          pageSize,
          totalPages
        };
      }
      
      // If the backend already returns paginated data, just return it
      return response.data;
    } catch (error) {
      console.error('Error in getPaginatedNotifications:', error);
      // Return empty result set instead of throwing
      return {
        items: [],
        totalCount: 0,
        pageNumber: filter.page || 1,
        pageSize: filter.pageSize || 10,
        totalPages: 0
      };
    }
  }
};

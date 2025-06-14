import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '@/lib/notificationService';
import { Notification, NotificationFilter } from '@/types/notification';
import { getAdvertiserIdFromToken } from '../lib/jwtHelper';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  fetchNotifications: (filter?: NotificationFilter) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Initialize notification service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const initializeNotifications = async () => {
        try {
          // Determine the appropriate ID to use based on user role
          let userId = user.id;
          let groupType = 'user';
          
          if (user.role === 'ADMIN') {
            // Admin should join a special admin group to receive all notifications
            groupType = 'admin';
            console.log(`Initializing notifications for ADMIN user: ${userId}`);
          } else if (user.role === 'AGENCY_MANAGER' && user.agencyId) {
            // Agency managers should join their agency group
            userId = user.agencyId;
            groupType = 'agency';
            console.log(`Initializing notifications for AGENCY_MANAGER with agencyId: ${userId}`);
          } else if (user.role === 'ADVERTISER') {
            // For advertisers, try to get the ID from the user object first, then from JWT token
            const token = localStorage.getItem('token');
            const advertiserId = user.advertiserId || (token ? getAdvertiserIdFromToken(token) : null);
            
            if (advertiserId) {
              userId = advertiserId;
              groupType = 'advertiser';
              console.log(`Initializing notifications with advertiserId: ${advertiserId}`);
            } else {
              console.error('No advertiser ID found for ADVERTISER user', { user });
              return;
            }
          }
          
          if (!userId) {
            console.error('No valid ID found for initializing notifications', { user });
            return;
          }
          
          await notificationService.initialize(userId, groupType);
          await refreshUnreadCount();
          await fetchNotifications();
        } catch (err) {
          console.error('Failed to initialize notifications:', err);
          setError(err instanceof Error ? err : new Error('Failed to initialize notifications'));
        }
      };

      initializeNotifications();

      // Set up event listeners
      notificationService.on('notification-received', handleNotificationReceived);
      notificationService.on('notification-read', handleNotificationRead);
      notificationService.on('notification-deleted', handleNotificationDeleted);

      // Clean up on unmount
      return () => {
        notificationService.off('notification-received', handleNotificationReceived);
        notificationService.off('notification-read', handleNotificationRead);
        notificationService.off('notification-deleted', handleNotificationDeleted);
        notificationService.stop();
      };
    }
  }, [isAuthenticated, user?.id]);

  // Handle new notification received
  const handleNotificationReceived = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    setTotalCount(prev => prev + 1);
  };

  // Handle notification marked as read
  const handleNotificationRead = ({ id }: { id: number }) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle notification deleted
  const handleNotificationDeleted = ({ id }: { id: number }) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
    
    // If the deleted notification was unread, decrease the unread count
    const deletedNotification = notifications.find(n => n.id === id);
    if (deletedNotification && !deletedNotification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Fetch notifications with optional filters
  const fetchNotifications = async (filter?: NotificationFilter) => {
    if (!isAuthenticated || !user) return;
    
    // Create a merged filter with pagination defaults
    const mergedFilter: NotificationFilter = { 
      page: pageNumber, 
      pageSize, 
      includeRead: filter?.includeRead !== undefined ? filter.includeRead : true,
      ...filter 
    };
    
    // Update pagination state if provided in filter
    if (filter?.page !== undefined) setPageNumber(filter.page);
    if (filter?.pageSize !== undefined) setPageSize(filter.pageSize);
    
    // Handle role-specific filtering
    if (user.role === 'ADMIN') {
      // Admin should see all notifications - don't set any userId filter
      console.log('Fetching all notifications for ADMIN user');
      // Admin filter doesn't need userId or agencyId - leave them undefined
    } else if (user.role === 'AGENCY_MANAGER' && user.agencyId) {
      // Agency managers should see notifications for their agency
      mergedFilter.agencyId = user.agencyId;
      console.log(`Fetching notifications for AGENCY_MANAGER with agencyId: ${user.agencyId}`);
    } else if (user.role === 'ADVERTISER') {
      // For advertisers, try to get the ID from the user object first, then from JWT token
      const token = localStorage.getItem('token');
      const advertiserId = user.advertiserId || (token ? getAdvertiserIdFromToken(token) : null);
      if (advertiserId) {
        mergedFilter.userId = advertiserId;
        console.log(`Fetching notifications with advertiserId: ${advertiserId}`);
      } else {
        console.error('No advertiser ID found for ADVERTISER user', { user });
        return;
      }
    } else {
      // Regular users see their own notifications
      mergedFilter.userId = user.id;
      console.log(`Fetching notifications for regular user: ${user.id}`);
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching notifications with filter:', mergedFilter);
      const response = await notificationService.getNotifications(mergedFilter);
      setNotifications(response.items);
      setTotalCount(response.totalCount);
      setPageNumber(response.pageNumber);
      setPageSize(response.pageSize);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Event handler will update the state
    } catch (err) {
      console.error(`Failed to mark notification ${notificationId} as read:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to mark notification as read`));
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Event handler will update the state
    } catch (err) {
      console.error(`Failed to delete notification ${notificationId}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to delete notification`));
    }
  };

  // Refresh unread count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      let userId = user.id;
      
      // Determine the appropriate ID to use based on user role
      if (user.role === 'ADMIN') {
        // Admin uses their own ID for unread count
        // This is different from notifications - admin only sees their own unread count
        console.log(`Refreshing unread count for ADMIN user: ${userId}`);
      } else if (user.role === 'AGENCY_MANAGER' && user.agencyId) {
        // Agency managers use their agency ID
        userId = user.agencyId;
        console.log(`Refreshing unread count for AGENCY_MANAGER with agencyId: ${userId}`);
      } else if (user.role === 'ADVERTISER') {
        // For advertisers, try to get the ID from the user object first, then from JWT token
        const token = localStorage.getItem('token');
        const advertiserId = user.advertiserId || (token ? getAdvertiserIdFromToken(token) : null);
        if (advertiserId) {
          userId = advertiserId;
          console.log(`Refreshing unread count with advertiserId: ${advertiserId}`);
        } else {
          console.error('No advertiser ID found for ADVERTISER user', { user });
          return;
        }
      }
      
      if (!userId) {
        console.error('No valid ID found for refreshing unread count', { user });
        return;
      }
      
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
    }  
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        totalCount,
        pageNumber,
        pageSize,
        totalPages,
        fetchNotifications,
        markAsRead,
        deleteNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  return context;
};

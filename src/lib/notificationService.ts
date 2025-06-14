import * as signalR from '@microsoft/signalr';
import { notificationAxios, notificationApi } from './notificationApi';
import { Notification, NotificationFilter, NotificationResponse } from '@/types/notification';

// Event types for notification events
export type NotificationEventType = 'notification-received' | 'notification-read' | 'notification-deleted' | 'connection-state-changed';

// Event handler type
export type NotificationEventHandler = (data: any) => void;

class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private eventHandlers: Map<NotificationEventType, NotificationEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000; // Start with 2 seconds
  private userId: number | null = null;
  private groupType: string = 'user';
  private connectionState: signalR.HubConnectionState = signalR.HubConnectionState.Disconnected;

  // Initialize the SignalR connection
  public async initialize(userId: number, groupType: string = 'user'): Promise<void> {
    if (this.hubConnection) {
      await this.stop();
    }

    this.userId = userId;
    this.groupType = groupType;
    console.log(`Initializing SignalR connection for ${groupType} ID: ${userId}`);

    try {
      // Create the hub connection
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/notificationHub', {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
          withCredentials: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Implement exponential backoff
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop trying to reconnect
            }
            
            // Exponential backoff with jitter
            const delay = Math.min(
              30000, // Max delay of 30 seconds
              this.reconnectInterval * Math.pow(2, retryContext.previousRetryCount)
            );
            return delay + Math.random() * 1000; // Add jitter
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
        console.log('Received notification:', notification);
        
        // Process notifications based on user role/group type
        let shouldProcess = false;
        
        if (this.groupType === 'admin') {
          // Admins receive all notifications
          shouldProcess = true;
        } else if (this.groupType === 'agency' && notification.agencyId === this.userId) {
          // Agency managers receive notifications for their agency
          shouldProcess = true;
        } else if (this.groupType === 'advertiser' && notification.advertiserId === this.userId) {
          // Advertisers receive notifications for their specific advertiser ID
          shouldProcess = true;
        } else if (this.groupType === 'user' && notification.userId === this.userId) {
          // Regular users receive notifications for their user ID
          shouldProcess = true;
        }
        
        if (shouldProcess) {
          this.triggerEvent('notification-received', notification);
        } else {
          console.warn('Received notification not intended for this user/group:', 
            { notificationData: { advertiserId: notification.advertiserId, agencyId: notification.agencyId }, 
              currentUser: { id: this.userId, groupType: this.groupType } });
        }
      });

      // Set up connection state change handlers
      this.hubConnection.onreconnecting((error) => {
        console.log('Connection reconnecting:', error);
        this.connectionState = signalR.HubConnectionState.Reconnecting;
        this.triggerEvent('connection-state-changed', { state: 'reconnecting', error });
      });

      this.hubConnection.onreconnected((connectionId) => {
        console.log('Connection reconnected with ID:', connectionId);
        this.connectionState = signalR.HubConnectionState.Connected;
        this.triggerEvent('connection-state-changed', { state: 'connected', connectionId });
        
        // Re-join the user group after reconnection
        if (this.userId) {
          this.joinUserGroup(this.userId, this.groupType);
        }
      });

      this.hubConnection.onclose((error) => {
        console.log('Connection closed:', error);
        this.connectionState = signalR.HubConnectionState.Disconnected;
        this.triggerEvent('connection-state-changed', { state: 'disconnected', error });
        
        // Try to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.start(), this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1));
        }
      });

      // Start the connection
      await this.start();
      
      // Join the user's specific group after connection is established
      if (this.userId) {
        await this.joinUserGroup(this.userId, this.groupType);
      }
    } catch (error) {
      console.error('Error initializing SignalR connection:', error);
      throw error;
    }
  }

  // Start the SignalR connection
  private async start(): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('Hub connection not initialized');
    }

    try {
      await this.hubConnection.start();
      console.log('SignalR connection started successfully');
      this.connectionState = signalR.HubConnectionState.Connected;
      this.triggerEvent('connection-state-changed', { state: 'connected' });
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Join the user group after connection
      if (this.userId) {
        await this.joinUserGroup(this.userId);
      }
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionState = signalR.HubConnectionState.Disconnected;
      this.triggerEvent('connection-state-changed', { state: 'error', error });
      
      // Try to reconnect if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.start(), this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1));
      }
    }
  }

  // Stop the SignalR connection
  public async stop(): Promise<void> {
    if (this.hubConnection) {
      try {
        // Leave the user group before stopping
        if (this.userId && this.hubConnection.state === signalR.HubConnectionState.Connected) {
          await this.leaveUserGroup(this.userId);
        }
        
        await this.hubConnection.stop();
        console.log('SignalR connection stopped');
        this.connectionState = signalR.HubConnectionState.Disconnected;
        this.triggerEvent('connection-state-changed', { state: 'disconnected' });
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  // Join user notification group
  public async joinUserGroup(userId: number, groupType: string = 'user'): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Cannot join user group: Hub connection not connected');
      return;
    }

    if (!userId) {
      console.error('Cannot join user group: Invalid user ID');
      return;
    }

    try {
      // Leave any existing group first to ensure clean state
      if (this.userId && (this.userId !== userId || this.groupType !== groupType)) {
        try {
          await this.leaveUserGroup(this.userId);
        } catch (error) {
          console.warn(`Error leaving previous group for ${this.groupType} ${this.userId}:`, error);
          // Continue anyway to join the new group
        }
      }

      // Determine which group to join based on groupType
      let groupMethod = 'JoinUserGroup';
      let groupId = userId.toString();
      
      switch (groupType) {
        case 'admin':
          groupMethod = 'JoinAdminGroup';
          break;
        case 'agency':
          groupMethod = 'JoinAgencyGroup';
          break;
        case 'advertiser':
          groupMethod = 'JoinAdvertiserGroup';
          break;
        default:
          groupMethod = 'JoinUserGroup';
      }
      
      // Join the appropriate group
      await this.hubConnection.invoke(groupMethod, groupId);
      console.log(`Joined ${groupType} notification group with ID: ${userId}`);
      
      // Update the stored userId and groupType
      this.userId = userId;
      this.groupType = groupType;
    } catch (error) {
      console.error(`Error joining ${groupType} notification group for ID ${userId}:`, error);
      throw error; // Propagate error to caller for better error handling
    }
  }

  // Leave user notification group
  public async leaveUserGroup(userId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Cannot leave user group: Hub connection not connected');
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveUserGroup', userId.toString());
      console.log(`Left notification group for user ${userId}`);
    } catch (error) {
      console.error(`Error leaving notification group for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Get connection state
  public getConnectionState(): signalR.HubConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get notifications based on filter criteria
   * @param filter Filter parameters including role-specific filters
   * @returns A promise that resolves to a NotificationResponse
   */
  public async getNotifications(filter: NotificationFilter): Promise<NotificationResponse> {
    try {
      console.log('NotificationService.getNotifications called with filter:', filter);
      
      // Use the paginated API with the provided filter
      return await notificationApi.getPaginatedNotifications(filter);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }
  
  /**
   * Get unread notification count for a user
   * @param userId The user ID to get unread count for
   * @returns A promise that resolves to the unread count
   */
  public async getUnreadCount(userId: number): Promise<number> {
    try {
      return await notificationApi.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark a notification as read
  public async markAsRead(notificationId: number): Promise<void> {
    try {
      // Use the new notificationApi service
      await notificationApi.markAsRead(notificationId);
      this.triggerEvent('notification-read', { id: notificationId });
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  // Delete a notification
  public async deleteNotification(notificationId: number): Promise<void> {
    try {
      // Use the new notificationApi service
      await notificationApi.deleteNotification(notificationId);
      this.triggerEvent('notification-deleted', { id: notificationId });
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  }

  // Event handling methods
  public on(eventType: NotificationEventType, handler: NotificationEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: NotificationEventType, handler: NotificationEventHandler): void {
    if (!this.eventHandlers.has(eventType)) return;
    
    const handlers = this.eventHandlers.get(eventType)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  private triggerEvent(eventType: NotificationEventType, data: any): void {
    if (!this.eventHandlers.has(eventType)) return;
    
    const handlers = this.eventHandlers.get(eventType)!;
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in notification event handler for ${eventType}:`, error);
      }
    });
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();
export default notificationService;

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellRing, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types/notification';
import { ScrollArea } from '@/components/ui/scroll-area';

// Export a hook to check if the notification context is available
export const useNotificationsContext = () => {
  const context = useNotifications();
  return context;
};

const NotificationBell: React.FC = () => {
  // Get notification context with fallbacks for all values
  const notificationContext = useNotificationsContext();
  const notifications = notificationContext?.notifications || [];
  const unreadCount = notificationContext?.unreadCount || 0;
  const markAsRead = notificationContext?.markAsRead;
  const deleteNotification = notificationContext?.deleteNotification;
  const fetchNotifications = notificationContext?.fetchNotifications;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const location = useLocation();

  // Fetch notifications when dropdown opens
  useEffect(() => {
    // Only fetch notifications when the dropdown is opened
    if (isOpen && fetchNotifications) {
      // Create a local function to avoid dependency on fetchNotifications
      const loadNotifications = async () => {
        try {
          await fetchNotifications({ pageSize: 5, includeRead: true });
        } catch (error) {
          console.error('Failed to fetch notifications for dropdown:', error);
        }
      };
      
      loadNotifications();
    }
    // Remove fetchNotifications from the dependency array to prevent infinite loops
  }, [isOpen]);

  // Handle notification click (mark as read)
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead && markAsRead) {
      await markAsRead(notification.id);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  // Handle delete notification
  const handleDelete = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (deleteNotification) {
      await deleteNotification(notification.id);
    }
  };
  
  // Get the appropriate notifications path based on user role and current location
  const getNotificationsPath = () => {
    // If user is admin, direct to admin notifications page
    if (user?.role === 'ADMIN') {
      return '/admin/notifications';
    }
    
    // Otherwise use path based on current location
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return '/admin/notifications';
    } else if (path.startsWith('/advertiser')) {
      return '/advertiser/notifications';
    } else if (path.startsWith('/agency')) {
      return '/agency/notifications';
    }
    
    // Default path
    return '/notifications';
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Created':
        return <span className="text-green-500">●</span>;
      case 'Updated':
        return <span className="text-blue-500">●</span>;
      case 'Deactivated':
        return <span className="text-amber-500">●</span>;
      case 'Reactivated':
        return <span className="text-purple-500">●</span>;
      case 'Deleted':
        return <span className="text-red-500">●</span>;
      default:
        return <span className="text-gray-500">●</span>;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={dropdownRef}
        align="end"
        className="w-80"
        sideOffset={5}
      >
        <div className="flex items-center justify-between px-4 py-2 font-medium">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(e, notification)}
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDelete(e, notification)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button asChild variant="outline" className="w-full">
            <Link to={getNotificationsPath()}>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

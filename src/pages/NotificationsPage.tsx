import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { Check, Trash2, Bell, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationFilter } from '@/types/notification';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { decodeJWT, getAdvertiserIdFromToken } from '../lib/jwtHelper';
import { notificationService } from '@/lib/notificationService';

const NotificationsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    notifications,
    loading,
    error,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    refreshUnreadCount
  } = useNotifications();
  
  // State for filter settings
  const [filter, setFilter] = useState<NotificationFilter>({
    includeRead: true,
    page: 1,
    pageSize: 10,
  });

  // State for connection status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [refreshing, setRefreshing] = useState(false);

  // Extract advertiserId from JWT token if needed
  const [advertiserId, setAdvertiserId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token && user.role === 'ADVERTISER') {
        const extractedId = getAdvertiserIdFromToken(token);
        if (extractedId) {
          console.log(`Found advertiserId in token: ${extractedId}`);
          setAdvertiserId(extractedId);
        }
      }
    }
  }, [isAuthenticated, user]);

  // Use refs to prevent infinite loops
  const isFirstRender = React.useRef(true);
  const lastFilterRef = React.useRef<NotificationFilter>(filter);
  
  // Memoize the filter to prevent unnecessary re-renders
  const stableFilter = React.useMemo(() => filter, [
    filter.includeRead,
    filter.page,
    filter.pageSize
  ]);
  
  // Function to load notifications with proper role-based filtering
  const loadNotifications = React.useCallback(async () => {
    if (!isAuthenticated || !user || !fetchNotifications) return;
    
    try {
      // Create a copy of the filter with role-specific properties
      const filterWithRole = { ...stableFilter };
      
      // Add role-specific filters
      if (user.role === 'AGENCY_MANAGER' && user.agencyId) {
        filterWithRole.agencyId = user.agencyId;
        console.log('Fetching notifications for agency manager:', filterWithRole);
      } else if (user.role === 'ADMIN') {
        // Admin sees all notifications, no special filters needed
        console.log('Fetching all notifications for admin:', filterWithRole);
      } else if (user.role === 'ADVERTISER') {
        // Advertisers only see their own notifications
        if (advertiserId) {
          filterWithRole.userId = advertiserId;
          console.log('Fetching notifications for advertiser:', filterWithRole);
        } else {
          console.error('No advertiserId found for user:', user);
          return;
        }
      }
      
      // Call the fetch function
      await fetchNotifications(filterWithRole);
      
      // Update the last filter reference
      lastFilterRef.current = { ...filterWithRole };
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [isAuthenticated, user, stableFilter, advertiserId, fetchNotifications]);
  
  // Listen for SignalR notification events
  useEffect(() => {
    if (!notificationService || !isAuthenticated) return;
    
    // Handler for when a new notification is received via SignalR
    const handleNotificationReceived = () => {
      console.log('Notification received via SignalR, refreshing notifications');
      loadNotifications();
    };
    
    // Subscribe to the notification-received event
    notificationService.on('notification-received', handleNotificationReceived);
    
    // Cleanup: unsubscribe when component unmounts
    return () => {
      notificationService.off('notification-received', handleNotificationReceived);
    };
  }, [notificationService, isAuthenticated, loadNotifications]);
  
  // Fetch notifications on mount and when filter changes
  useEffect(() => {
    // Skip if not authenticated or no user
    if (!isAuthenticated || !user) return;
    
    // Function to check if the filter has actually changed
    const hasFilterChanged = () => {
      const prev = lastFilterRef.current;
      return (
        prev.includeRead !== stableFilter.includeRead ||
        prev.page !== stableFilter.page ||
        prev.pageSize !== stableFilter.pageSize
      );
    };
    
    // Only fetch if it's the first render or if the filter has changed
    if (isFirstRender.current || hasFilterChanged()) {
      loadNotifications();
      isFirstRender.current = false;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, stableFilter]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      // First refresh unread count
      if (typeof refreshUnreadCount === 'function') {
        await refreshUnreadCount();
      }
      
      // Then load notifications using our optimized function
      await loadNotifications();
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    // Only update if the page actually changed
    if (filter.page !== page) {
      setFilter(prev => ({ ...prev, page }));
    }
  };

  // Handle filter change
  const handleFilterChange = (includeRead: boolean) => {
    // Only update if the value actually changed to prevent unnecessary re-renders
    if (filter.includeRead !== includeRead) {
      const newFilter = { ...filter, includeRead, page: 1 };
      setFilter(newFilter);
      
      // Update the last filter ref immediately to prevent double fetching
      // This is needed because the effect might run before our state update is processed
      lastFilterRef.current = newFilter;
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Handle delete notification
  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get notification type badge
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case 'Created':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Created</Badge>;
      case 'Updated':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Updated</Badge>;
      case 'Deactivated':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Deactivated</Badge>;
      case 'Reactivated':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Reactivated</Badge>;
      case 'Deleted':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <Button 
          variant={pageNumber === 1 ? "default" : "outline"}
          size="icon"
          onClick={() => handlePageChange(1)}
          className="h-9 w-9"
        >
          1
        </Button>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (pageNumber > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <div className="flex h-9 w-9 items-center justify-center">...</div>
        </PaginationItem>
      );
    }

    // Add pages around current page
    const startPage = Math.max(2, pageNumber - 1);
    const endPage = Math.min(totalPages - 1, pageNumber + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        items.push(
          <PaginationItem key={i}>
            <Button 
              variant={pageNumber === i ? "default" : "outline"}
              size="icon"
              onClick={() => handlePageChange(i)}
              className="h-9 w-9"
            >
              {i}
            </Button>
          </PaginationItem>
        );
      }
    }

    // Add ellipsis if needed
    if (pageNumber < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <div className="flex h-9 w-9 items-center justify-center">...</div>
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <Button 
            variant={pageNumber === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => handlePageChange(totalPages)}
            className="h-9 w-9"
          >
            {totalPages}
          </Button>
        </PaginationItem>
      );
    }

    return items;
  };

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Please log in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  {user?.role === 'AGENCY_MANAGER' ? 'Agency Notifications' : 'My Notifications'}
                </div>
              </CardTitle>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filter.includeRead}
                onCheckedChange={(checked) => {
                  // Only call handleFilterChange if checked is a boolean
                  if (typeof checked === 'boolean') {
                    handleFilterChange(checked);
                  }
                }}
              >
                Show read notifications
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {/* Role-based description */}
          <div className="mb-4 text-sm text-muted-foreground">
            {user?.role === 'AGENCY_MANAGER'
              ? 'As an agency manager, you can view and manage notifications for advertisers in your agency.'
              : 'View and manage your personal notifications.'}
          </div>
          
          {error ? (
            <div className="py-8 text-center text-red-500">
              <p>Failed to load notifications. Please try again later.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No notifications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow 
                          key={notification.id}
                          className={!notification.isRead ? 'bg-muted/30' : ''}
                        >
                          <TableCell>
                            {getNotificationTypeBadge(notification.type)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {notification.message}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(notification.createdAt), 'MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.createdAt), 'h:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(notification.id)}
                                title="Delete notification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((pageNumber - 1) * pageSize + 1, totalCount)} to {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} notifications
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
                          disabled={pageNumber === 1}
                          className="gap-1"
                        >
                          <span className="sr-only">Go to previous page</span>
                          Previous
                        </Button>
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handlePageChange(Math.min(totalPages, pageNumber + 1))}
                          disabled={pageNumber === totalPages}
                          className="gap-1"
                        >
                          <span className="sr-only">Go to next page</span>
                          Next
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;

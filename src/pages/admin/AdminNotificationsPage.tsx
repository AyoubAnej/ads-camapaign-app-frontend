import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Check, Trash2, Bell, Filter } from 'lucide-react';
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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

const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuth();
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
  } = useNotifications();
  
  const [filter, setFilter] = useState<NotificationFilter>({
    includeRead: true,
    page: 1,
    pageSize: 10,
  });

  // Use a ref to track if we've already done the initial fetch
  const initialFetchDoneRef = React.useRef(false);
  
  // Fetch notifications on mount and when filter changes
  useEffect(() => {
    if (user) {
      // Admin sees all notifications
      fetchNotifications(filter);
      initialFetchDoneRef.current = true;
    }
  }, [filter, user]); // Removed fetchNotifications from dependencies

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  // Handle filter change
  const handleFilterChange = (includeRead: boolean) => {
    setFilter(prev => ({ ...prev, includeRead, page: 1 }));
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  // Handle delete notification
  const handleDelete = async (id: number) => {
    await deleteNotification(id);
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
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={pageNumber === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (pageNumber > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
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
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={pageNumber === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Add ellipsis if needed
    if (pageNumber < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={pageNumber === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Admin Notifications
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
                onCheckedChange={handleFilterChange}
              >
                Show read notifications
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {/* Admin-specific description */}
          <div className="mb-4 text-sm text-muted-foreground">
            As an administrator, you can view and manage all notifications in the system.
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
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading skeleton
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Skeleton className="h-8 w-8 rounded-md" />
                              <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No notifications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow
                          key={notification.id}
                          className={!notification.isRead ? 'bg-muted/50' : ''}
                        >
                          <TableCell>
                            {getNotificationTypeBadge(notification.type)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {notification.message}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {notification.userId 
                                ? `User #${notification.userId}` 
                                : notification.advertiserId 
                                  ? `Advertiser #${notification.advertiserId}` 
                                  : 'System'}
                            </span>
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

export default AdminNotificationsPage;

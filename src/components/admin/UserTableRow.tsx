import { User as UserIcon, Pencil, Trash, Edit } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/types/auth';
import { Advertiser } from '@/lib/advertiserApi';

interface UserTableRowProps {
  user: Advertiser;
  onEdit: (user: Advertiser) => void;
  onDelete: (user: Advertiser) => void;
  deactivateUserMutation: any;
  reactivateUserMutation: any;
  setSelectedActionUser: (user: Advertiser | null) => void;
  setIsDeactivateModalOpen: (open: boolean) => void;
  setIsReactivateModalOpen: (open: boolean) => void;
}

export const UserTableRow = ({ user, onEdit, onDelete, deactivateUserMutation, reactivateUserMutation, setSelectedActionUser, setIsDeactivateModalOpen, setIsReactivateModalOpen }: UserTableRowProps) => {
  if (!user) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'ADVERTISER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'AGENCY_MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatRole = (role: string): string => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Admin';
      case 'ADVERTISER':
        return 'Advertiser';
      case 'AGENCY_MANAGER':
        return 'Agency Manager';
      default:
        return role || 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-2">
            <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          {user.firstName} {user.lastName}
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={getRoleBadgeColor(user.role)} variant="outline">
          {formatRole(user.role)}
        </Badge>
      </TableCell>
      <TableCell>{user.shopName || 'N/A'}</TableCell>
      <TableCell>{user.address || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={getStatusBadgeColor(user.status)} variant="outline">
          {user.status || 'Unknown'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {user.status?.toLowerCase() === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedActionUser(user);
                setIsDeactivateModalOpen(true);
              }}
              className="text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedActionUser(user);
                setIsReactivateModalOpen(true);
              }}
              className="text-green-500 border-green-600 hover:bg-green-600 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(user)}
            className="text-red-500 border-red-600 hover:bg-red-600 hover:text-white"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

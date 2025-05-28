import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Advertiser } from '@/lib/advertiserApi';
import { useTranslation } from 'react-i18next';

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Advertiser;
  onDeleteUser: (id: number) => void;
}

export const DeleteUserModal = ({ open, onOpenChange, user, onDeleteUser }: DeleteUserModalProps) => {
  const { t } = useTranslation();
  
  // Safe guard against null/undefined user
  if (!user) {
    return null;
  }
  
  const handleDelete = () => {
    onDeleteUser(user.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.userManagement.confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.userManagement.deleteWarning', { 
              userName: `${user.firstName} ${user.lastName}` 
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

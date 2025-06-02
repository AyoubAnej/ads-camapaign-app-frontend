import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GetAdResponseDto } from '@/types/ad';
import { useTranslation } from 'react-i18next';

interface DeleteAdModalProps {
  ad: GetAdResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteAd: () => void;
}

const DeleteAdModal: React.FC<DeleteAdModalProps> = ({
  ad,
  open,
  onOpenChange,
  onDeleteAd,
}) => {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('ads.deleteAd')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('ads.deleteAdConfirmation', { adTitle: ad.title })} 
            <br />
            {t('admin.agencyManagement.undoneAction')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteAd} className="bg-red-600 hover:bg-red-700">
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteAdModal };

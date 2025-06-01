import React from 'react';
import { useTranslation } from 'react-i18next';
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
          <AlertDialogTitle>{t('ads.modal.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('ads.modal.delete.description')}
            <br />
            {t('ads.modal.delete.warning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('ads.modal.delete.buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteAd} className="bg-red-600 hover:bg-red-700">
            {t('ads.modal.delete.buttons.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteAdModal };

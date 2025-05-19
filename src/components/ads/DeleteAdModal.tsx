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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ad</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the ad "{ad.title}" (ID: {ad.adId})?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteAd} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteAdModal };

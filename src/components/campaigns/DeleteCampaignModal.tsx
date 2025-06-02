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
import { GetCampaignResponseDto } from '@/types/campaign';
import { t } from 'i18next';

interface DeleteCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: GetCampaignResponseDto;
  onDeleteCampaign: () => void;
}

export const DeleteCampaignModal: React.FC<DeleteCampaignModalProps> = ({
  open,
  onOpenChange,
  campaign,
  onDeleteCampaign,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.userMangement.confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('camapaign.deleteCampaignWarning')} "{campaign.campaignName}" (ID: {campaign.campaignId}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('commmon.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteCampaign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t('commmon.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

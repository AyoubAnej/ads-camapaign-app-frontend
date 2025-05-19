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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the campaign "{campaign.campaignName}" (ID: {campaign.campaignId}).
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteCampaign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GetCampaignResponseDto, getGlobalStateString, getCampaignTypeString } from '@/types/campaign';
import { Calendar, DollarSign, Tag } from 'lucide-react';

interface CampaignDetailsCardProps {
  campaign: GetCampaignResponseDto;
  isLoading: boolean;
}

export const CampaignDetailsCard: React.FC<CampaignDetailsCardProps> = ({ campaign, isLoading }) => {
  // Format date with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get campaign status badge
  const getCampaignStatusBadge = () => {
    const isActive = campaign.globalState === "OK"; // 0 is OK/Active in GlobalState enum
    
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{campaign.campaignName}</CardTitle>
            <CardDescription>Campaign ID: {campaign.campaignId}</CardDescription>
          </div>
          {getCampaignStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              Campaign Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{getCampaignTypeString(campaign.campaignType)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{getGlobalStateString(campaign.globalState)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium">{formatDate(campaign.campaignStartDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium">{campaign.campaignEndDate ? formatDate(campaign.campaignEndDate) : 'No end date'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(campaign.creationDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{formatDate(campaign.updateDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Tenant ID:</span>
                <span className="font-medium">{campaign.tenantId}</span>
              </div>
            </div>
          </div>

          {/* Bidding Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Bidding Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Bid Amount:</span>
                <span className="font-medium">
                  {campaign.bid?.amount ? formatCurrency(campaign.bid.amount) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{campaign.bid?.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">Strategy:</span>
                <span className="font-medium">{campaign.bid?.strategy || 'Manual'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Spaces section has been removed as it's now obsolete */}
      </CardContent>
    </Card>
  );
};

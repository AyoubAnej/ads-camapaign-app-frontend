import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GetCampaignResponseDto, getGlobalStateString, getCampaignTypeString } from '@/types/campaign';
import { Calendar, DollarSign, Tag } from 'lucide-react';
import { t } from 'i18next';

interface CampaignDetailsCardProps {
  campaign: GetCampaignResponseDto;
  isLoading: boolean;
}

export const CampaignDetailsCard: React.FC<CampaignDetailsCardProps> = ({ campaign, isLoading }) => {
  // Format date with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('campaign.notAvailable');
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return t('campaign.invalidDate');
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
    const isActive = campaign.globalState === "OK";
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
        {isActive ? t('campaign.active') : t('campaign.inactive')}
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
            <CardDescription>{t('campaign.campaignID')}: {campaign.campaignId}</CardDescription>
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
              {t('campaign.campaignInformation')}
            </h3>
            <div className="space-y-2">
              <InfoRow label={t('campaign.type')} value={getCampaignTypeString(campaign.campaignType)} />
              <InfoRow label={t('campaign.status')} value={getGlobalStateString(campaign.globalState)} />
              <InfoRow label={t('campaign.startDate')} value={formatDate(campaign.campaignStartDate)} />
              <InfoRow label={t('campaign.endDate')} value={campaign.campaignEndDate ? formatDate(campaign.campaignEndDate) : t('campaign.noEndDate')} />
              <InfoRow label={t('campaign.created')} value={formatDate(campaign.creationDate)} />
              <InfoRow label={t('campaign.updated')} value={formatDate(campaign.updateDate)} />
              <InfoRow label={t('campaign.tenantId')} value={campaign.tenantId} />
            </div>
          </div>

          {/* Bidding Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              {t('campaign.biddingInformation')}
            </h3>
            <div className="space-y-2">
              <InfoRow
                label={t('campaign.bidAmount')}
                value={campaign.bid?.amount ? formatCurrency(campaign.bid.amount) : t('campaign.notAvailable')}
              />
              <InfoRow label={t('campaign.currency')} value={campaign.bid?.currency || 'USD'} />
              <InfoRow label={t('campaign.strategy')} value={campaign.bid?.strategy || 'Manual'} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Reusable Info row
const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

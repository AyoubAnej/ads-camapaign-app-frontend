import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdTable } from '@/components/ads/AdTable';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '@/lib/campaignApi';
import { adApi } from '@/lib/adApi';
import { productApi } from '@/lib/productApi';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, DollarSign, Tag, BarChart2, Target, Clock, Plus, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdDetailsCard } from '@/components/ads/AdDetailsCard';
import { CampaignDetailsCard } from '@/components/campaigns/CampaignDetailsCard';
import { useTranslation } from 'react-i18next';

export const AdPage = () => {
  const { campaignId, adId } = useParams<{ campaignId: string; adId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { t } = useTranslation();
  
  // Fetch campaign data
  const { data: campaign, isLoading: isLoadingCampaign, error: campaignError } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID is required');
      return await campaignApi.getCampaign(parseInt(campaignId));
    },
    enabled: !!campaignId,
  });

  // Fetch ad data if adId is provided
  const {
    data: ad,
    isLoading: isLoadingAd,
    error: adError
  } = useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      if (!adId) throw new Error('Ad ID is required');
      return await adApi.getAd(parseInt(adId));
    },
    enabled: !!adId,
  });

  // Fetch product data if ad is loaded and has a productId
  const {
    data: product,
    isLoading: isLoadingProduct,
  } = useQuery({
    queryKey: ['product', ad?.productId],
    queryFn: async () => {
      if (!ad?.productId) throw new Error('Product ID is required');
      return await productApi.getProductById(ad.productId);
    },
    enabled: !!ad?.productId,
  });

  // Handle back button click
  const handleBackClick = () => {
    if (adId) {
      // If we're viewing an ad, go back to the campaign's ads list
      navigate(`/campaigns/${campaignId}/ads`);
    } else {
      // If we're viewing the campaign's ads list, go back to campaigns based on user role
      navigateToCampaigns();
    }
  };
  
  // Navigate to the appropriate campaigns page based on user role
  const navigateToCampaigns = () => {
    const userRole = user?.role;
    
    if (userRole === 'ADMIN') {
      navigate('/admin/campaigns');
    } else if (userRole === 'ADVERTISER') {
      navigate('/advertiser/campaigns');
    } else if (userRole === 'AGENCY_MANAGER') {
      navigate('/agency/campaigns');
    } else {
      // Fallback to a common route if role is unknown
      navigate('/campaigns');
    }
  };

  // Loading state for campaign
  if (isLoadingCampaign) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading campaign details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for ad
  if (adId && isLoadingAd && !ad) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading ad details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if ((campaignError && !adId) || (adError && adId) || !campaignId) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md p-6 my-4">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 dark:text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Campaign</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{adId ? (adError instanceof Error ? adError.message : 'Failed to load ad details') : (campaignError instanceof Error ? campaignError.message : 'Failed to load campaign details')}</p>
          <Button 
            variant="default"
            onClick={navigateToCampaigns}
          >
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

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

  // Format campaign status
  const getCampaignStatusBadge = () => {
    if (!campaign) return null;
    
    const isActive = campaign.globalState === "OK"; // GlobalState.OK = 0, DISABLED = 1
    
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header section with campaign name and back button */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {adId ? `${t('ads.ad')}: ${ad?.title || 'Loading...'}` : campaign?.campaignName || 'Campaign'}
            </h1>
            {adId ? null : getCampaignStatusBadge()}
          </div>
          <Button variant="ghost" size="sm" className="-ml-2" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {adId ? t('adminDashboard.backToCampaignAds') : t('adminDashboard.backToCampaigns')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-6 text-gray-600 dark:text-gray-300 text-sm md:text-base">
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span className="font-medium">{campaign?.campaignType || 'Unknown'} {t('adminDashboard.campaign')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{t('adminDashboard.campaignStartDate')}: {formatDate(campaign?.campaignStartDate)}</span>
          </div>
          {campaign?.campaignEndDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{t('adminDashboard.campaignEndDate')}: {formatDate(campaign?.campaignEndDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Campaign details section */}
      {/* If viewing a specific ad, show ad details */}
      {adId && ad ? (
        <div className="mb-6">
          <AdDetailsCard ad={ad} product={product || null} isLoadingProduct={isLoadingProduct} />
        </div>
      ) : campaign && (
        <Tabs defaultValue="details" className="mb-6">
          <TabsList className="mb-2">
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {campaign.bid?.amount ? `$${campaign.bid.amount.toFixed(2)} ${campaign.bid.currency || 'USD'}` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.bid?.strategy || 'Manual'} bidding strategy
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {campaign.campaignEndDate ? 
                      `${Math.ceil((new Date(campaign.campaignEndDate).getTime() - new Date(campaign.campaignStartDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                      'Ongoing'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(campaign.campaignStartDate)} - {campaign.campaignEndDate ? formatDate(campaign.campaignEndDate) : 'No end date'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                    Campaign Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {campaign.bid ? `${campaign.bid.amount} ${campaign.bid.currency}` : 'No bid set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Campaign ID: {campaign.campaignId}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Campaign Description</CardTitle>
                <CardDescription>
                  Details and objectives for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {/* Using optional chaining since description might not exist in the type */}
                  {(campaign as any).description || 'No description provided for this campaign.'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium mb-2">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tenant ID</p>
                      <p>{campaign.tenantId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created On</p>
                      <p>{formatDate(campaign.creationDate) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <CampaignDetailsCard campaign={campaign} isLoading={false} />
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Analytics and metrics for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Performance metrics will be available once the campaign has been running for at least 24 hours.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Ad table section follows */}
      
      {/* Ad table section without header - only show if not viewing a specific ad */}
      {!adId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <AdTable campaignId={parseInt(campaignId)} />
        </div>
      )}
    </div>
  );
};

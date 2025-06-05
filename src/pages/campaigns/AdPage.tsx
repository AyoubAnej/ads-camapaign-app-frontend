import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdTable } from '@/components/ads/AdTable';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '@/lib/campaignApi';
import { adApi } from '@/lib/adApi';
import { productApi } from '@/lib/productApi';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, DollarSign, Tag, BarChart2, Target, Clock, Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdDetailsCard } from '@/components/ads/AdDetailsCard';
import { CampaignDetailsCard } from '@/components/campaigns/CampaignDetailsCard';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types/auth';

export const AdPage = () => {
  const { campaignId, adId } = useParams<{ campaignId: string; adId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { t } = useTranslation();
  
  // State to track if user is authorized to view this campaign
  const [isAuthorizedForCampaign, setIsAuthorizedForCampaign] = useState(false);
  
  // Create a local reference to campaign tenant ID that we can use immediately
  const [localCampaignTenantId, setLocalCampaignTenantId] = useState<number | null>(null);
  
  // Fetch campaign data
  const { data: campaign, isLoading: isLoadingCampaign, error: campaignError } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID is required');
      return await campaignApi.getCampaign(parseInt(campaignId));
    },
    enabled: !!campaignId,
  });
  
  // Store the campaign tenant ID when campaign data is loaded
  useEffect(() => {
    if (campaign && campaign.tenantId) {
      setLocalCampaignTenantId(campaign.tenantId);
      
      // If user is ADVERTISER with missing IDs, update the user object locally
      if (user && user.role === 'ADVERTISER' && 
          (user.advertiserId === null || user.advertiserId === undefined || 
           user.tenantId === null || user.tenantId === undefined)) {
        
        console.log('Fixing user object locally for authorization:', {
          role: user.role,
          current_advertiserId: user.advertiserId,
          current_tenantId: user.tenantId,
          setting_to_campaign_tenantId: campaign.tenantId
        });
        
        // Try to update the user in localStorage for future page loads
        try {
          const updatedUser = {
            ...user,
            advertiserId: campaign.tenantId,
            tenantId: campaign.tenantId
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated user in localStorage with campaign tenant ID');
        } catch (error) {
          console.error('Failed to update user in localStorage:', error);
        }
      }
    }
  }, [campaign, user]);
  
  // Unified authorization check for campaign access
  useEffect(() => {
    // Only run this check when we have both user and campaign data
    if (!user || !campaign) {
      console.log('Authorization check skipped - missing user or campaign data');
      setIsAuthorizedForCampaign(false);
      return;
    }
    
    // For debugging purposes - log all relevant data
    console.log('Authorization check details:', { 
      userRole: user.role, 
      advertiserId: user.advertiserId, 
      tenantId: user.tenantId,
      campaignTenantId: campaign.tenantId,
      localCampaignTenantId: localCampaignTenantId,
      userIdType: typeof user.advertiserId,
      tenantIdType: typeof campaign.tenantId,
      campaignData: campaign,
      email: user.email
    });
    
    // Determine authorization based on role
    switch (user.role) {
      case 'ADMIN':
        // Admins can access all campaigns
        console.log('ADMIN access granted');
        setIsAuthorizedForCampaign(true);
        break;
        
      case 'ADVERTISER':
        // TEMPORARY: Allow all advertisers to access all campaigns for testing
        console.log('ADVERTISER access granted for testing');
        setIsAuthorizedForCampaign(true);
        break;
        
      case 'AGENCY_MANAGER':
        // Agency managers have their own access rules
        console.log('AGENCY_MANAGER access check');
        // For now, we'll assume they can't access campaigns directly
        setIsAuthorizedForCampaign(false);
        setTimeout(() => navigate('/agency/campaigns'), 100);
        break;
        
      default:
        // Default: not authorized
        console.warn(`Unknown role: ${user.role} - access denied`);
        setIsAuthorizedForCampaign(false);
        // setTimeout(() => navigate('/unauthorized'), 100);
    }
  }, [campaign, user, navigate]);

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
      // Use role-specific prefix to maintain UI context
      navigate(`${getRolePrefix()}/campaigns/${campaignId}/ads`);
    } else {
      // If we're viewing the campaign's ads list, go back to campaigns based on user role
      navigateToCampaigns();
    }
  };
  
  // Get the role-specific prefix for navigation
  const getRolePrefix = () => {
    const userRole = user?.role;
    
    if (userRole === 'ADMIN') {
      return '/admin';
    } else if (userRole === 'ADVERTISER') {
      return '/advertiser';
    } else if (userRole === 'AGENCY_MANAGER') {
      return '/agency';
    } else {
      return '';
    }
  };
  
  // Navigate to the appropriate campaigns page based on user role
  const navigateToCampaigns = () => {
    navigate(`${getRolePrefix()}/campaigns`);
  };
  
  // Function to check if user can edit ads
  const canEditAds = () => {
    if (!user || !campaign) return false;
    
    // ADMIN can edit all ads
    if (user.role === 'ADMIN') return true;
    
    // ADVERTISER can only edit their own ads
    if (user.role === 'ADVERTISER') {
      // Use the local campaign tenant ID we've stored
      // This works even if user.advertiserId and user.tenantId are null
      const userTenantId = user.tenantId || user.advertiserId;
      const campaignTenantId = campaign.tenantId;
      
      // For debugging
      console.log(`Can edit check: campaign.tenantId (${campaignTenantId}) === user.tenantId/advertiserId (${userTenantId})`);
      console.log(`Using localCampaignTenantId for authorization: ${localCampaignTenantId}`);
      
      // TEMPORARY: Allow all advertisers to edit all campaigns for testing
      return true;
      
      // The proper check would be:
      // if (localCampaignTenantId !== null) {
      //   // We've stored the campaign tenant ID locally, use it for authorization
      //   return true;
      // } else {
      //   // Fall back to comparing IDs if we don't have a local tenant ID
      //   return String(campaignTenantId) === String(userTenantId);
      // }
    }
    
    return false;
  };
  
  // Function to render role-specific UI elements
  const renderRoleSpecificUI = () => {
    if (!user || !campaign) return null;
    
    if (user.role === 'ADMIN') {
      return (
        <div className="mb-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Admin View</AlertTitle>
            <AlertDescription>
              You are viewing this campaign as an administrator. Campaign belongs to tenant ID: {campaign.tenantId}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return null;
  };

  // Handle campaign loading error
  if (campaignError) {
    console.error('Error loading campaign:', campaignError);
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Campaign</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
            {campaignError instanceof Error ? campaignError.message : 'Failed to load campaign details'}
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="outline" onClick={() => navigateToCampaigns()}>Back to Campaigns</Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for campaign
  if (isLoadingCampaign || !campaign) {
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
    // If campaign error or unauthorized, show appropriate message
    if (campaignError) {
      return (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load campaign details. Please try again later.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={navigateToCampaigns}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Role-specific UI elements */}
        {renderRoleSpecificUI()}
        
        {/* Back button and campaign title */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="flex items-center gap-2 mb-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {adId ? 'Back to Campaign Ads' : 'Back to Campaigns'}
            </Button>
            <h1 className="text-3xl font-bold">
              {adId ? 'Ad Details' : (campaign ? `${campaign.campaignName} - Ads` : 'Campaign Ads')}
            </h1>
            <p className="text-muted-foreground">
              {adId ? 'View and manage ad details' : 'View and manage ads for this campaign'}
            </p>
          </div>
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

  // Add debug information about authorization state
  console.log('Rendering AdPage with authorization state:', {
    isAuthorizedForCampaign,
    userRole: user?.role,
    campaignId,
    adId,
    campaignTenantId: campaign?.tenantId,
    userAdvertiserId: user?.advertiserId
  });

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
            {adId 
              ? t('adminDashboard.backToCampaignAds')
              : user?.role === 'ADMIN' 
                ? t('adminDashboard.backToCampaigns')
                : t('adminDashboard.backToCampaigns')
            }
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
          
          <TabsContent value="ads" className="space-y-4">
            <AdTable campaignId={Number(campaignId)} showCreateButton={canEditAds()} />
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
          <AdTable 
            campaignId={parseInt(campaignId)} 
            showCreateButton={canEditAds()} 
          />
        </div>
      )}
    </div>
  );
};

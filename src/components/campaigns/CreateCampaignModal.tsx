import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { campaignApi } from '@/lib/campaignApi';
import { advertiserApi, Advertiser } from '@/lib/advertiserApi';
import { useQuery } from '@tanstack/react-query';
import { 
  CreateCampaignRequestDto, 
  GlobalState, 
  CampaignType,
  StateType,
  BidStrategy,
  BidType,
  getGlobalStateString,
  getCampaignTypeString
} from '@/types/campaign';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCampaign: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  open,
  onOpenChange,
  onCreateCampaign
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalState, setGlobalState] = useState<GlobalState>(GlobalState.OK);
  const [campaignType, setCampaignType] = useState<CampaignType>(CampaignType.SPONSORED);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if user is an advertiser to handle the ID automatically
  const isAdvertiser = user?.role === 'ADVERTISER';
  
  // Ensure we have a valid advertiser ID by providing fallbacks
  // For ADVERTISER users: use advertiserId > tenantId > id > 1 (default)
  // For non-ADVERTISER users: use selected ID from dropdown or default to 1 if none selected
  const defaultId = '1'; // Fallback ID if nothing else is available
  const advertiserId = isAdvertiser 
    ? String(user?.advertiserId || user?.tenantId || user?.id || defaultId)
    : (selectedAdvertiserId || defaultId);
  
  // Debug logging for advertiser ID resolution
  useEffect(() => {
    if (isAdvertiser) {
      console.log('User object:', user);
      console.log('Advertiser ID resolution:', {
        advertiserId: user?.advertiserId,
        tenantId: user?.tenantId,
        userId: user?.id,
        resolvedId: advertiserId
      });
    }
  }, [isAdvertiser, user, advertiserId]);
  
  // Fetch advertisers for dropdown
  const { data: advertisers = [], isLoading: isLoadingAdvertisers } = useQuery({
    queryKey: ['advertisers'],
    queryFn: async () => {
      try {
        const advertisers = await advertiserApi.getAllAdvertisers();
        return advertisers;
      } catch (error) {
        console.error('Error fetching advertisers:', error);
        return [];
      }
    },
    enabled: open, // Only fetch when modal is open
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setStartDate('');
      setEndDate('');
      setGlobalState(GlobalState.OK);
      setCampaignType(CampaignType.SPONSORED);
      
      // Only reset selectedAdvertiserId for non-ADVERTISER users
      // For ADVERTISER users, we'll use their ID from the JWT
      if (!isAdvertiser) {
        setSelectedAdvertiserId('');
      }
      
      setError(null);
    }
  }, [open, isAdvertiser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!name) {
        throw new Error('Campaign name is required');
      }

      if (!startDate) {
        throw new Error('Start date is required');
      }

      // Format dates as ISO strings to ensure proper serialization
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = endDate ? new Date(endDate).toISOString() : null;

      // For ADVERTISER role, we use their own ID from the JWT
      // For other roles, we require a selection from the dropdown
      if (!isAdvertiser && !selectedAdvertiserId) {
        throw new Error('Advertiser selection is required');
      }
      
      // Use the advertiserId variable which handles both cases
      // We should always have an advertiserId now due to our fallback logic
      console.log('Using advertiser ID for campaign creation:', advertiserId);
      
      // Try to parse as integer, but handle gracefully if it fails
      let tenantId: number;
      try {
        tenantId = parseInt(advertiserId, 10);
        if (isNaN(tenantId)) {
          console.warn('Invalid advertiser ID format, using default ID 1');
          tenantId = 1; // Default to ID 1 if parsing fails
        }
      } catch (err) {
        console.error('Error parsing advertiser ID:', advertiserId);
        console.warn('Using default advertiser ID 1');
        tenantId = 1; // Default to ID 1 if parsing throws an error
      }

      // Create campaign with properly formatted data
      const campaignData: CreateCampaignRequestDto = {
        campaignName: name,
        campaignStartDate: new Date(startDateISO),
        campaignEndDate: endDateISO ? new Date(endDateISO) : null,
        globalState: globalState,
        tenantId: tenantId,
        campaignType: campaignType,
        ownerActivation: {
          isActive: true, // Match the StateObject interface
          activatedAt: new Date().toISOString(),
          reason: 'Created by user'
        },
        bid: {
          amount: 1.0, // Match the BidObject interface
          currency: 'USD',
          strategy: BidStrategy.MANUAL.toString()
        }
      };

      // Log the tenant ID source for debugging
      console.log('Campaign creation details:', {
        userRole: user?.role,
        isAdvertiser,
        tenantIdSource: isAdvertiser ? 'JWT token (user object)' : 'Selected from dropdown',
        tenantId,
        userAdvertiserId: user?.advertiserId,
        userTenantId: user?.tenantId,
        userId: user?.id
      });
      
      console.log('Sending campaign data:', JSON.stringify(campaignData, null, 2));
      
      await campaignApi.createCampaign(campaignData);
      onCreateCampaign();
      onOpenChange(false);
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new campaign.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Only show advertiser selection for non-ADVERTISER roles */}
            {!isAdvertiser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="advertiser" className="text-right">
                  Advertiser
                </Label>
                <Select 
                  value={selectedAdvertiserId} 
                  onValueChange={setSelectedAdvertiserId}
                  disabled={isLoadingAdvertisers}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an advertiser" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAdvertisers ? (
                      <SelectItem value="loading" disabled>Loading advertisers...</SelectItem>
                    ) : advertisers.length === 0 ? (
                      <SelectItem value="none" disabled>No advertisers found</SelectItem>
                    ) : (
                      advertisers.filter(advertiser => advertiser.role !== 'AGENCY_MANAGER' && advertiser.role !== 'ADMIN')
                      .map((advertiser: Advertiser) => (
                        <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                          {advertiser.id} - {advertiser.shopName }
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Display the advertiser ID being used for ADVERTISER users */}
            {isAdvertiser && user?.advertiserId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Advertiser ID</Label>
                <div className="col-span-3 text-sm text-muted-foreground border rounded p-2">
                  Using your advertiser ID: {user.advertiserId}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className={cn(
                  "col-span-3 cursor-pointer hover:border-primary",
                  "[&::-webkit-calendar-picker-indicator]:text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:bg-foreground/50 [&::-webkit-calendar-picker-indicator]:hover:bg-foreground/70 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                )}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className={cn(
                  "col-span-3 cursor-pointer hover:border-primary",
                  "[&::-webkit-calendar-picker-indicator]:text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:bg-foreground/50 [&::-webkit-calendar-picker-indicator]:hover:bg-foreground/70 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={globalState.toString()} 
                onValueChange={(value) => setGlobalState(value as GlobalState)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GlobalState.OK.toString()}>{getGlobalStateString(GlobalState.OK)}</SelectItem>
                  <SelectItem value={GlobalState.DISABLED.toString()}>{getGlobalStateString(GlobalState.DISABLED)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={campaignType.toString()} 
                onValueChange={(value) => setCampaignType(value as CampaignType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CampaignType.SPONSORED.toString()}>{getCampaignTypeString(CampaignType.SPONSORED)}</SelectItem>
                  <SelectItem value={CampaignType.SPONSOREDPLUS.toString()}>{getCampaignTypeString(CampaignType.SPONSOREDPLUS)}</SelectItem>
                  <SelectItem value={CampaignType.HEADLINE.toString()}>{getCampaignTypeString(CampaignType.HEADLINE)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'New Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

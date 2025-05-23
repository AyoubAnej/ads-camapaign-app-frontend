import React, { useState, useEffect, useRef } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
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
  getCampaignTypeString,
  AdsSpaceObject
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
  const [adsSpaces, setAdsSpaces] = useState<AdsSpaceObject[]>([]);
  const [showAddAdsSpace, setShowAddAdsSpace] = useState(false);
  const [newAdsSpace, setNewAdsSpace] = useState<AdsSpaceObject>({
    spaceId: '',
    platform: 'Web',
    placement: 'TopBanner',
    size: '300x250',
    baseCost: 0
  });

  // Fetch advertisers
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
      setSelectedAdvertiserId('');
      setAdsSpaces([]);
      setShowAddAdsSpace(false);
      setNewAdsSpace({
        spaceId: '',
        platform: 'Web',
        placement: 'TopBanner',
        size: '300x250',
        baseCost: 0
      });
      setError(null);
    }
  }, [open]);

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

      if (!selectedAdvertiserId) {
        throw new Error('Advertiser selection is required');
      }

      const tenantId = parseInt(selectedAdvertiserId);
      if (isNaN(tenantId)) {
        throw new Error('Invalid advertiser ID');
      }

      // Format dates as ISO strings to ensure proper serialization
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = endDate ? new Date(endDate).toISOString() : null;

      // Create campaign with properly formatted data
      const newCampaign: CreateCampaignRequestDto = {
        campaignName: name,
        campaignStartDate: new Date(startDate), // Keep as Date object for type compatibility
        campaignEndDate: endDate ? new Date(endDate) : null, // Keep as Date object for type compatibility
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
        },
        adsSpaceList: adsSpaces
      };

      console.log('Sending campaign data:', JSON.stringify(newCampaign, null, 2));
      
      await campaignApi.createCampaign(newCampaign);
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
                    advertisers.map((advertiser: Advertiser) => (
                      <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                         {advertiser.id} - {advertiser.shopName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

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
            
            {/* Ad Spaces Section */}
            <div className="grid grid-cols-1 gap-4">
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <Label className="text-md font-semibold">Ad Spaces</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddAdsSpace(!showAddAdsSpace)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ad Space
                </Button>
              </div>
              
              {/* Add Ad Space Form */}
              {showAddAdsSpace && (
                <Card className="border border-dashed p-2">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="spaceId">Space ID</Label>
                        <Input
                          id="spaceId"
                          value={newAdsSpace.spaceId}
                          onChange={(e) => setNewAdsSpace({...newAdsSpace, spaceId: e.target.value})}
                          placeholder="e.g., SPACE_001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Select 
                          value={newAdsSpace.platform} 
                          onValueChange={(value) => setNewAdsSpace({...newAdsSpace, platform: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Web">Web</SelectItem>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                            <SelectItem value="TV">TV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="placement">Placement</Label>
                        <Select 
                          value={newAdsSpace.placement} 
                          onValueChange={(value) => setNewAdsSpace({...newAdsSpace, placement: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select placement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TopBanner">Top Banner</SelectItem>
                            <SelectItem value="Sidebar">Sidebar</SelectItem>
                            <SelectItem value="InContent">In Content</SelectItem>
                            <SelectItem value="Footer">Footer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="size">Size</Label>
                        <Select 
                          value={newAdsSpace.size} 
                          onValueChange={(value) => setNewAdsSpace({...newAdsSpace, size: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300x250">300x250</SelectItem>
                            <SelectItem value="728x90">728x90</SelectItem>
                            <SelectItem value="160x600">160x600</SelectItem>
                            <SelectItem value="320x50">320x50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="baseCost">Base Cost</Label>
                        <Input
                          id="baseCost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newAdsSpace.baseCost.toString()}
                          onChange={(e) => setNewAdsSpace({...newAdsSpace, baseCost: parseFloat(e.target.value) || 0})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={() => {
                            if (!newAdsSpace.spaceId) {
                              setError('Space ID is required');
                              return;
                            }
                            setAdsSpaces([...adsSpaces, {...newAdsSpace}]);
                            setNewAdsSpace({
                              spaceId: '',
                              platform: 'Web',
                              placement: 'TopBanner',
                              size: '300x250',
                              baseCost: 0
                            });
                            setShowAddAdsSpace(false);
                            setError(null);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Ad Spaces List */}
              {adsSpaces.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {adsSpaces.map((space, index) => (
                    <Card key={index} className="p-2">
                      <CardContent className="p-2 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{space.spaceId}</div>
                          <div className="text-sm text-muted-foreground">
                            {space.platform} | {space.placement} | {space.size} | ${space.baseCost.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdsSpaces(adsSpaces.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No ad spaces added yet. Click "Add Ad Space" to add one.
                </div>
              )}
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

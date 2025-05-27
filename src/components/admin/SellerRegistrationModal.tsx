import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Seller } from '@/types/seller';
import { UserRole } from '@/types/auth';
import { sellersApi } from '@/lib/sellersApi';
import { advertiserApi } from '@/lib/advertiserApi';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

interface SellerRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterSeller: (userData: {
    sellerId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    address: string;
    shopName: string;
    role: UserRole;
    agencyId?: number | null;
  }) => void;
}

export const SellerRegistrationModal = ({ 
  open, 
  onOpenChange,
  onRegisterSeller 
}: SellerRegistrationModalProps) => {
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADVERTISER');
  const [agencyId, setAgencyId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sellers using React Query
  const { data: sellers = [], isLoading: isLoadingSellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const result = await sellersApi.getAllSellers(false);
      console.log('Fetched sellers data:', result);
      return result;
    },
    enabled: open,
  });
  
  // Fetch advertisers to filter out already registered sellers
  const { data: advertisers = [], isLoading: isLoadingAdvertisers } = useQuery({
    queryKey: ['advertisers'],
    queryFn: async () => {
      const result = await advertiserApi.getAllAdvertisers();
      console.log('Fetched advertisers data:', result);
      return result;
    },
    enabled: open,
  });
  
  // Filter out sellers who are already registered as advertisers
  const unregisteredSellers = sellers.filter(seller => {
    // Check if this seller's ID exists in any advertiser's sellerId
    return !advertisers.some(advertiser => advertiser.sellerId === seller.sellerId);
  });
  
  // Show loading state while either query is loading
  const isLoading = isLoadingSellers || isLoadingAdvertisers;

  // Convert unregistered sellers to combobox options
  const sellerOptions: ComboboxOption[] = unregisteredSellers.map((seller) => {
    console.log('Processing unregistered seller:', seller);
    // Use shopName if available, otherwise fallback to firstName + lastName
    const displayName = seller.shopName || `${seller.firstName} ${seller.lastName}'s Shop`;
    return {
      value: seller.sellerId.toString(),
      label: `${seller.sellerId} - ${displayName}`
    };
  });

  // Mutation for registering a seller as an advertiser
  const registerSellerMutation = useMutation({
    mutationFn: async (seller: Seller) => {
      const userData = {
        sellerId: seller.sellerId,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        password: seller.password,
        phoneNumber: seller.phoneNumber,
        address: seller.address,
        shopName: seller.shopName,
        role: selectedRole,
        ...(selectedRole === 'AGENCY_MANAGER' ? { agencyId: parseInt(agencyId, 10) || 0 } : {})
      };
      
      console.log('Sending user data:', userData);
      
      return advertiserApi.registerAdvertiser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      toast({
        title: 'Success',
        description: 'Seller has been registered as a user successfully.',
      });
      onOpenChange(false);
      setSelectedSellerId(null);
      setSelectedRole('ADVERTISER');
      setAgencyId('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to register seller as user. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSellerId === null) {
      toast({
        title: 'Validation Error',
        description: 'Please select a seller.',
        variant: 'destructive',
      });
      return;
    }

    const seller = sellers.find(s => s.sellerId === selectedSellerId);
    
    if (!seller) {
      toast({
        title: 'Error',
        description: 'Selected seller not found.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Selected seller:', seller);
    registerSellerMutation.mutate(seller);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register Seller as an Advertiser</DialogTitle>
          <DialogDescription>
            Select a seller from the list to register them as a user in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seller" className="text-right">
                Seller
              </Label>
              <div className="col-span-3">
                <Combobox
                  options={sellerOptions}
                  value={selectedSellerId}
                  onChange={setSelectedSellerId}
                  placeholder={isLoading ? "Loading sellers..." : "Search by shop name or ID..."}
                  emptyMessage={sellerOptions.length === 0 ? "All sellers are already registered" : "No sellers found"}
                  disabled={isLoading || sellerOptions.length === 0}
                  loading={isLoading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ADVERTISER">Advertiser</SelectItem>
                  <SelectItem value="AGENCY_MANAGER">Agency Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Agency ID input field - only shown when Agency Manager role is selected */}
            {selectedRole === 'AGENCY_MANAGER' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agencyId" className="text-right">
                  Agency ID
                </Label>
                <div className="col-span-3">
                  <Input
                    id="agencyId"
                    type="number"
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    placeholder="Enter agency ID"
                    className="w-full"
                    required={selectedRole === 'AGENCY_MANAGER'}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || sellerOptions.length === 0}>
              {isLoading ? 'Loading...' : sellerOptions.length === 0 ? 'No Unregistered Sellers' : 'Register Seller'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

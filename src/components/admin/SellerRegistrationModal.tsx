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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

// Form schema for admin registration
const adminFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

export const SellerRegistrationModal = ({ 
  open, 
  onOpenChange,
  onRegisterSeller 
}: SellerRegistrationModalProps) => {
  // State for tab selection
  const [registrationType, setRegistrationType] = useState<'seller' | 'admin'>('seller');
  
  // Seller registration states
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADVERTISER');
  const [agencyId, setAgencyId] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Admin registration form
  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
    },
  });
  
  // Reset form when modal closes
  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Reset all state
      setSelectedSellerId(null);
      setSelectedRole('ADVERTISER');
      setAgencyId('');
      adminForm.reset();
    }
    onOpenChange(open);
  };

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

  // Mutation for registering a seller as an advertiser or agency manager
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
      
      console.log('Sending seller user data:', userData);
      
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

  // Mutation for registering an admin user directly
  const registerAdminMutation = useMutation({
    mutationFn: async (formData: AdminFormValues) => {
      // Generate a 6-digit sellerId for admin users (between 100000 and 999999)
      const adminSellerId = 100000 + Math.floor(Math.random() * 900000);
      
      const userData = {
        sellerId: adminSellerId, // Use a generated 6-digit number for admin users
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        shopName: formData.firstName + ' ' + formData.lastName, // Use name as shop name for admin users
        role: 'ADMIN' as UserRole,
      };
      
      console.log('Sending admin user data:', userData);
      
      return advertiserApi.registerAdvertiser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      toast({
        title: 'Success',
        description: 'Admin user has been registered successfully.',
      });
      handleModalClose(false);
      adminForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to register admin user. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Handle seller form submission
  const handleSellerSubmit = async (e: React.FormEvent) => {
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
  
  // Handle admin form submission
  const handleAdminSubmit = (formData: AdminFormValues) => {
    console.log('Admin form data:', formData);
    registerAdminMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Register New User</DialogTitle>
          <DialogDescription>
            Create a new user in the system either from an existing seller or as an admin.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={registrationType} 
          onValueChange={(value) => setRegistrationType(value as 'seller' | 'admin')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="seller">Register from Seller</TabsTrigger>
            <TabsTrigger value="admin">Register Admin</TabsTrigger>
          </TabsList>
          
          {/* Seller Registration Flow */}
          <TabsContent value="seller">
            <form onSubmit={handleSellerSubmit}>
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
                  <Select 
                    value={selectedRole} 
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    disabled={selectedRole === 'ADMIN'} // Disable changing to ADMIN in seller flow
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Button type="button" variant="outline" onClick={() => handleModalClose(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || sellerOptions.length === 0 || registerSellerMutation.isPending}
                >
                  {isLoading ? 'Loading...' : 
                   registerSellerMutation.isPending ? 'Registering...' : 
                   sellerOptions.length === 0 ? 'No Unregistered Sellers' : 
                   'Register User'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          {/* Admin Registration Flow */}
          <TabsContent value="admin">
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={adminForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adminForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={adminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adminForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormDescription>Must be at least 6 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adminForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adminForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => handleModalClose(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={registerAdminMutation.isPending}
                  >
                    {registerAdminMutation.isPending ? 'Registering...' : 'Register Admin'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

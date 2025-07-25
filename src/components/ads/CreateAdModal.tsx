import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { adApi } from '@/lib/adApi';
import { campaignApi } from '@/lib/campaignApi';
import { CreateAdRequestDto } from '@/types/ad';
import { StateObject, BidObject } from '@/types/campaign';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Image, Link2, Info, Tag, BarChart3, CheckCircle2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface CreateAdModalProps {
  campaignId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAd: () => void;
}

// Form schema
const formSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  redirectUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  activatedAt: z.string().datetime({ message: 'Must be a valid ISO date-time' }).optional().or(z.literal('')),
  deactivatedAt: z.string().datetime({ message: 'Must be a valid ISO date-time' }).optional().or(z.literal('')),
  reason: z.string().optional(),
  bidAmount: z.coerce.number().min(0.01, "Bid amount must be greater than 0"),
  bidCurrency: z.string().default("USD"),
  bidStrategy: z.string().default("MANUAL"),
});

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  campaignId,
  open,
  onOpenChange,
  onCreateAd,
}) => {
  // Toast notifications
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch campaign data to get advertiser information
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      return await campaignApi.getCampaign(campaignId);
    },
    enabled: !!campaignId && open, // Only fetch when modal is open and campaignId exists
  });
  
  // Determine if user is an advertiser
  const isAdvertiser = user?.role === 'ADVERTISER';
  
  // Get the advertiser ID from the campaign or user
  const advertiserId = campaign?.tenantId || (isAdvertiser ? user?.advertiserId : null);
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      title: "",
      description: "",
      mediaUrl: "",
      redirectUrl: "",
      isActive: true,
      activatedAt: '',
      deactivatedAt: '',
      reason: '',
      bidAmount: 1.0,
      bidCurrency: "USD",
      bidStrategy: "MANUAL",
    },
  });

  // Mutation for creating ad
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: CreateAdRequestDto) => {
      return await adApi.createAd(campaignId, data);
    },
    onSuccess: () => {
      toast({
        title: "Ad Created",
        description: "Your ad was successfully created.",
        variant: "default",
      });
      onCreateAd();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error Creating Ad",
        description: error instanceof Error ? error.message : "An error occurred while creating the ad",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Format dates properly for backend
    const now = new Date().toISOString();
    
    // Create state object exactly as the backend expects it
    const adState: StateObject = {
      isActive: values.isActive,
      // Use empty string instead of undefined for optional fields
      activatedAt: values.isActive ? (values.activatedAt || now) : null,
      deactivatedAt: !values.isActive ? (values.deactivatedAt || now) : null,
      reason: values.reason || "",
    };

    // Create bid object exactly as the backend expects it
    const bid: BidObject = {
      amount: values.bidAmount,
      currency: values.bidCurrency || "USD",
      strategy: values.bidStrategy || "CPC",
    };

    // Create ad request
    const createRequest: CreateAdRequestDto = {
      productId: values.productId,
      title: values.title,
      description: values.description || "",
      adState: adState,
      bid: bid,
      keywords: []
    };
    
    // Log the advertiser information for debugging
    console.log('Ad creation details:', {
      campaignId,
      advertiserId,
      userRole: user?.role,
      isAdvertiser,
      campaignTenantId: campaign?.tenantId,
      userAdvertiserId: user?.advertiserId
    });

    console.log('Creating ad with data:', JSON.stringify(createRequest, null, 2));
    mutate(createRequest);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Create New Ad</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a new advertisement for your campaign.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2 flex-1 overflow-y-auto px-6">
            <div className="space-y-6">
              {/* --- Ad Details Section --- */}
              {/* Display advertiser information */}
              {advertiserId && (
                <div className="mb-4 bg-muted/50 p-3 rounded-md border">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      This ad will be created for the advertiser associated with the campaign
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Ad Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product ID" />
                        </FormControl>
                        <FormDescription>Unique product identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ad title" />
                        </FormControl>
                        <FormDescription>Short, catchy headline for your ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe your ad (optional)" />
                        </FormControl>
                        <FormDescription>Optional: additional details about your ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mediaUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://your-store.com/image.png" />
                        </FormControl>
                        <FormDescription>Image or video to display in your ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="redirectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redirect URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://your-store.com/product" />
                        </FormControl>
                        <FormDescription>Where users will go when clicking the ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* --- Bid Settings Section --- */}
              <div className="pt-6 border-t border-muted space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Bid Settings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              {...field}
                              className="pl-7"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Maximum bid per click</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bidCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Currency for bidding</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bidStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Strategy</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANUAL">Manual Bidding</SelectItem>
                            <SelectItem value="AUTO">Automatic Bidding</SelectItem>
                            <SelectItem value="TARGET_CPA">Target CPA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How your bid will be managed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* --- Ad State Section --- */}
              <div className="pt-6 border-t border-muted space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Ad State</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 p-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="m-0">Active</FormLabel>
                        <FormDescription className="m-0">Toggle to activate or deactivate this ad</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Only show Reason if inactive */}
                  {!form.watch('isActive') && (
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason (if inactive)</FormLabel>
                          <Input {...field} placeholder="Reason for deactivation (optional)" />
                          <FormDescription>Explain why this ad is inactive</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                {/* Only show date fields if relevant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {form.watch('isActive') && (
                    <FormField
                      control={form.control}
                      name="activatedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activated At</FormLabel>
                          <Input {...field} type="datetime-local" placeholder="Activation date/time (optional)" />
                          <FormDescription>When this ad became active</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {!form.watch('isActive') && (
                    <FormField
                      control={form.control}
                      name="deactivatedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deactivated At</FormLabel>
                          <Input {...field} type="datetime-local" placeholder="Deactivation date/time (optional)" />
                          <FormDescription>When this ad became inactive</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 mt-4">
                {error instanceof Error ? error.message : "An error occurred while creating the ad"}
              </div>
            )}
            
            <DialogFooter className="mt-0 py-3 border-t bg-background sticky bottom-0 z-10 px-6 flex flex-row gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? "Creating..." : "Create Ad"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

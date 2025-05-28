import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
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
import { GetAdResponseDto, UpdateAdRequestDto } from '@/types/ad';
import { StateObject, BidObject } from '@/types/campaign';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Info, Tag, BarChart3, CheckCircle2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface EditAdModalProps {
  ad: GetAdResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditAd: () => void;
}

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  activatedAt: z.string().datetime({ message: 'Must be a valid ISO date-time' }).optional().or(z.literal('')),
  deactivatedAt: z.string().datetime({ message: 'Must be a valid ISO date-time' }).optional().or(z.literal('')),
  reason: z.string().optional(),
  bidAmount: z.coerce.number().min(0.01, "Bid amount must be greater than 0"),
  bidCurrency: z.string().default("USD"),
  bidStrategy: z.string().default("MANUAL"),
});

export const EditAdModal: React.FC<EditAdModalProps> = ({
  ad,
  open,
  onOpenChange,
  onEditAd,
}) => {
  // Toast notifications
  const { toast } = useToast();
  
  // Initialize form with empty defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      isActive: true,
      activatedAt: '',
      deactivatedAt: '',
      reason: '',
      bidAmount: 1.0,
      bidCurrency: "USD",
      bidStrategy: "MANUAL",
    },
  });

  // Reset form with current ad data when ad changes or modal opens
  React.useEffect(() => {
    if (ad && open) {
      form.reset({
        title: ad.title || "",
        description: ad.description || "",
        keywords: ad.keywords || [],
        isActive: ad.adState?.isActive ?? true,
        activatedAt: ad.adState?.activatedAt || '',
        deactivatedAt: ad.adState?.deactivatedAt || '',
        reason: ad.adState?.reason || '',
        bidAmount: ad.bid?.amount || 1.0,
        bidCurrency: ad.bid?.currency || "USD",
        bidStrategy: ad.bid?.strategy || "MANUAL",
      });
    }
  }, [ad, form, open]);

  // Handle modal close
  const handleCloseModal = () => {
    form.reset(); // Reset form when closing
    onOpenChange(false);
  };

  // Mutation for updating ad
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: UpdateAdRequestDto) => {
      return await adApi.updateAd(ad.adId, data);
    },
    onSuccess: () => {
      toast({
        title: "Ad Updated",
        description: `The ad "${ad.title}" was successfully updated.`,
        variant: "default",
      });
      onEditAd();
      handleCloseModal();
    },
    onError: (error) => {
      toast({
        title: "Error Updating Ad",
        description: error instanceof Error ? error.message : "An error occurred while updating the ad",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Create clean adState object that conforms to StateObject interface
    const adState: StateObject = {
      isActive: values.isActive
    };
    
    // Only add date fields if they have values
    if (values.isActive && values.activatedAt) {
      adState.activatedAt = values.activatedAt;
    }
    
    if (!values.isActive && values.deactivatedAt) {
      adState.deactivatedAt = values.deactivatedAt;
    }
    
    if (!values.isActive && values.reason) {
      adState.reason = values.reason;
    }
    
    // Create clean bid object
    const bid: BidObject = {
      amount: values.bidAmount,
      currency: values.bidCurrency,
      strategy: values.bidStrategy,
    };
    
    // Prepare the update request with only defined values
    const updateData: UpdateAdRequestDto = {
      title: values.title,
      bid: bid
    };
    
    // Only add optional fields if they have values
    if (values.description) {
      updateData.description = values.description;
    }
    
    if (values.keywords && values.keywords.length > 0) {
      updateData.keywords = values.keywords;
    }
    
    // Only add adState if it has properties beyond isActive
    updateData.adState = adState;
    
    // Log the request data for debugging
    console.log('Updating ad with data:', JSON.stringify(updateData));
    
    // Submit the update
    mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Edit Ad</DialogTitle>
          <DialogDescription>
            Update the details of your advertisement.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2 flex-1 overflow-y-auto px-6">
            <div className="space-y-6">
              {/* --- Ad Details Section --- */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Ad Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <div className="relative">
                          <div className="absolute left-2 top-2.5 text-muted-foreground">
                            <Tags className="h-4 w-4" />
                          </div>
                          <FormControl>
                            <Input 
                              value={field.value.join(', ')} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const keywords = value.split(',').map(k => k.trim()).filter(Boolean);
                                field.onChange(keywords);
                              }}
                              className="pl-8" 
                              placeholder="shoes, sports, running" 
                            />
                          </FormControl>
                        </div>
                        <FormDescription>Keywords related to this ad (comma separated)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* --- Bid Settings Section --- */}
              <div className="pt-4 border-t border-muted space-y-2">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <div className="pt-4 border-t border-muted space-y-2">
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
            
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 mt-4">
                {error instanceof Error ? error.message : "An error occurred while updating the ad"}
              </div>
            )}
            
            <DialogFooter className="mt-0 py-3 border-t bg-background sticky bottom-0 z-10 px-6 flex flex-row gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Ad"}
              </Button>
            </DialogFooter>
          </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

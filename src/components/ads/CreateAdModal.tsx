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
import { CreateAdRequestDto } from '@/types/ad';
import { StateObject, BidObject } from '@/types/campaign';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Image, Link2, Info, Tag, BarChart3, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  // Toast notifications
  const { toast } = useToast();
  
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
        title: t('ads.modal.create.success.title'),
        description: t('ads.modal.create.success.description'),
        variant: "default",
      });
      onCreateAd();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('ads.modal.create.error.title'),
        description: error instanceof Error ? error.message : t('ads.modal.create.error.description'),
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

    console.log('Creating ad with data:', JSON.stringify(createRequest, null, 2));
    mutate(createRequest);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t('ads.modal.create.title')}</DialogTitle>
          <DialogDescription>
            {t('ads.modal.create.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2 flex-1 overflow-y-auto px-6">
            <div className="space-y-6">
              {/* --- Ad Details Section --- */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{t('ads.modal.create.sections.adDetails')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.productId.label')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('ads.modal.create.fields.productId.placeholder')} />
                        </FormControl>
                        <FormDescription>{t('ads.modal.create.fields.productId.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.title.label')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('ads.modal.create.fields.title.placeholder')} />
                        </FormControl>
                        <FormDescription>{t('ads.modal.create.fields.title.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.description.label')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t('ads.modal.create.fields.description.placeholder')} />
                        </FormControl>
                        <FormDescription>{t('ads.modal.create.fields.description.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mediaUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.mediaUrl.label')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('ads.modal.create.fields.mediaUrl.placeholder')} />
                        </FormControl>
                        <FormDescription>{t('ads.modal.create.fields.mediaUrl.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="redirectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.redirectUrl.label')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('ads.modal.create.fields.redirectUrl.placeholder')} />
                        </FormControl>
                        <FormDescription>{t('ads.modal.create.fields.redirectUrl.description')}</FormDescription>
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
                  <h3 className="font-semibold text-lg">{t('ads.modal.create.sections.bidSettings')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.bidAmount.label')}</FormLabel>
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
                        <FormDescription>{t('ads.modal.create.fields.bidAmount.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bidCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.bidCurrency.label')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('ads.modal.create.fields.bidCurrency.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t('ads.modal.create.fields.bidCurrency.description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bidStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ads.modal.create.fields.bidStrategy.label')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('ads.modal.create.fields.bidStrategy.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANUAL">{t('ads.modal.create.fields.bidStrategy.options.manual')}</SelectItem>
                            <SelectItem value="AUTO">{t('ads.modal.create.fields.bidStrategy.options.auto')}</SelectItem>
                            <SelectItem value="TARGET_CPA">{t('ads.modal.create.fields.bidStrategy.options.targetCpa')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t('ads.modal.create.fields.bidStrategy.description')}</FormDescription>
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
                  <h3 className="font-semibold text-lg">{t('ads.modal.create.sections.adState')}</h3>
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
                        <FormLabel className="m-0">{t('ads.modal.create.fields.isActive.label')}</FormLabel>
                        <FormDescription className="m-0">{t('ads.modal.create.fields.isActive.description')}</FormDescription>
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
                          <FormLabel>{t('ads.modal.create.fields.reason.label')}</FormLabel>
                          <Input {...field} placeholder={t('ads.modal.create.fields.reason.placeholder')} />
                          <FormDescription>{t('ads.modal.create.fields.reason.description')}</FormDescription>
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
                          <FormLabel>{t('ads.modal.create.fields.activatedAt.label')}</FormLabel>
                          <Input {...field} type="datetime-local" placeholder={t('ads.modal.create.fields.activatedAt.placeholder')} />
                          <FormDescription>{t('ads.modal.create.fields.activatedAt.description')}</FormDescription>
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
                          <FormLabel>{t('ads.modal.create.fields.deactivatedAt.label')}</FormLabel>
                          <Input {...field} type="datetime-local" placeholder={t('ads.modal.create.fields.deactivatedAt.placeholder')} />
                          <FormDescription>{t('ads.modal.create.fields.deactivatedAt.description')}</FormDescription>
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
                {error instanceof Error ? error.message : t('ads.modal.create.error.generic')}
              </div>
            )}
            
            <DialogFooter className="mt-0 py-3 border-t bg-background sticky bottom-0 z-10 px-6 flex flex-row gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('ads.modal.create.buttons.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? t('ads.modal.create.buttons.creating') : t('ads.modal.create.buttons.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

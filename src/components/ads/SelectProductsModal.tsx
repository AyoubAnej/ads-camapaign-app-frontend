import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/useAuth';
import { adApi } from '@/lib/adApi';

interface SelectProductsModalProps {
  campaignId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsSelected: () => void;
}

// Form schema
const formSchema = z.object({
  defaultBidAmount: z.coerce.number().min(0.01, "Default bid amount must be greater than 0"),
  productIds: z.array(z.string()).min(1, "At least one product must be selected"),
});

export const SelectProductsModal: React.FC<SelectProductsModalProps> = ({
  campaignId,
  open,
  onOpenChange,
  onProductsSelected,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultBidAmount: 1.0,
      productIds: [],
    },
  });

  // Fetch seller products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['sellerProducts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      return await adApi.getSellerProducts(user.id);
    },
    enabled: !!user?.id && open,
  });

  // Mutation for selecting products
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!user?.id) throw new Error('User ID is required');
      const request = {
        productIds: data.productIds,
        defaultBidAmount: data.defaultBidAmount,
      };
      return await adApi.selectProductsForSeller(campaignId, user.id, request);
    },
    onSuccess: () => {
      onProductsSelected();
      onOpenChange(false);
      form.reset();
      setSelectedProducts([]);
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values);
  };

  // Handle individual product selection
  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId]);
      form.setValue('productIds', [...selectedProducts, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter(id => id !== productId));
      form.setValue('productIds', selectedProducts.filter(id => id !== productId));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!products) return;
    
    const allProductIds = products.map((product: any) => product.id);
    if (selectedProducts.length === allProductIds.length) {
      // Deselect all
      setSelectedProducts([]);
      form.setValue('productIds', []);
    } else {
      // Select all
      setSelectedProducts(allProductIds);
      form.setValue('productIds', allProductIds);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('ads.modal.selectProducts.title')}</DialogTitle>
          <DialogDescription>{t('ads.modal.selectProducts.description')}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="defaultBidAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ads.modal.selectProducts.defaultBid.label')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('ads.modal.selectProducts.defaultBid.description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <FormLabel>{t('ads.modal.selectProducts.selection.title')}</FormLabel>
                  <FormControl>
                    <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                      {isLoadingProducts ? (
                        <div className="text-center py-4">
                          {t('ads.modal.selectProducts.selection.loading')}
                        </div>
                      ) : products && products.length > 0 ? (
                        <>
                          <div className="flex items-center mb-2 pb-2 border-b">
                            <Checkbox
                              id="select-all"
                              checked={products.length > 0 && selectedProducts.length === products.length}
                              onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor="select-all" className="ml-2 font-medium">
                              {t('ads.modal.selectProducts.selection.selectAll')}
                            </label>
                          </div>
                          <div className="space-y-2">
                            {products.map((product: any) => (
                              <div key={product.id} className="flex items-center">
                                <Checkbox
                                  id={`product-${product.id}`}
                                  checked={selectedProducts.includes(product.id)}
                                  onCheckedChange={(checked) => 
                                    handleProductSelection(product.id, !!checked)
                                  }
                                />
                                <label htmlFor={`product-${product.id}`} className="ml-2">
                                  {product.name || product.id}
                                </label>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          {t('ads.modal.selectProducts.selection.noProducts')}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-red-500 text-sm">
                {error instanceof Error ? error.message : t('ads.modal.selectProducts.error')}
              </div>
            )}
            
            <DialogFooter>
              <Button type="submit" disabled={isPending || selectedProducts.length === 0}>
                {isPending ? 
                  t('ads.modal.selectProducts.buttons.processing') : 
                  t('ads.modal.selectProducts.buttons.add')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

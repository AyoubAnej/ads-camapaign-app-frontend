import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GetAdResponseDto } from '@/types/ad';
import { Product } from '@/types/product';
import { DollarSign, Calendar, Tag, Box, ShoppingCart, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdDetailsCardProps {
  ad: GetAdResponseDto;
  product: Product | null;
  isLoadingProduct: boolean;
}

export const AdDetailsCard: React.FC<AdDetailsCardProps> = ({ ad, product, isLoadingProduct }) => {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get ad status badge
  const getAdStatusBadge = () => {
    const isActive = ad.adState?.isActive; // Check isActive property from adState
    
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const { t } = useTranslation();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{ad.title}</CardTitle>
            <CardDescription>{t('ads.adCard.ad_details.card.ad_id')}: {ad.adId}</CardDescription>
          </div>
          {getAdStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ad Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              {t('ads.adCard.ad_details.card.ad_info')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.card.description')}: </span>
                <span className="font-medium">{ad.description || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.card.created')}: </span>
                <span className="font-medium">{formatDate(ad.creationDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.card.updated')}: </span>
                <span className="font-medium">{formatDate(ad.updateDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.card.keywords')}: </span>
                <div className="flex flex-wrap justify-end gap-1">
                  {ad.keywords && ad.keywords.length > 0 ? (
                    ad.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="font-medium">{t('ads.adCard.ad_details.card.no_keywords')}</span>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-medium mb-3 mt-6 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              {t('ads.adCard.ad_details.bidding_info.title')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.bidding_info.bid_amount')}: </span>
                <span className="font-medium">
                  {ad.bid?.amount ? formatCurrency(ad.bid.amount) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.bidding_info.currency')}: </span>
                <span className="font-medium">{ad.bid?.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.adCard.ad_details.bidding_info.strategy')}: </span>
                <span className="font-medium">{ad.bid?.strategy || 'Manual'}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-purple-500" />
              {t('ads.adCard.ad_details.product_info.title')}
            </h3>
            
            {isLoadingProduct ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : product ? (
              <div>
                {product.imageUrl && (
                  <div className="mb-4 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.product_id')}: </span>
                    <span className="font-medium">{product.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.name')}: </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.price')}: </span>
                    <span className="font-medium">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.quantity')}: </span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.category')}: </span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.adCard.ad_details.product_info.seller_id')}: </span>
                    <span className="font-medium">{product.sellerId}</span>
                  </div>
                  <div className="py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground block mb-1">{t('ads.adCard.ad_details.product_info.description')}: </span>
                    <p className="text-sm">{product.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  {t('ads.adCard.ad_details.product_info.not_available')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

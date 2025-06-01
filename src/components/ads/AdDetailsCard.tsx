import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GetAdResponseDto } from '@/types/ad';
import { Product } from '@/types/product';
import { DollarSign, Calendar, Tag, Box, ShoppingCart, Hash } from 'lucide-react';

interface AdDetailsCardProps {
  ad: GetAdResponseDto;
  product: Product | null;
  isLoadingProduct: boolean;
}

export const AdDetailsCard: React.FC<AdDetailsCardProps> = ({ ad, product, isLoadingProduct }) => {
  const { t } = useTranslation();
  // Format date with fallback
  const formatDate = (dateString?: string) => {    if (!dateString) return t('common.notAvailable');
    try {
      return new Date(dateString).toLocaleDateString(t('common.locale'), {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{ad.title}</CardTitle>
            <CardDescription>{t('ads.details.adId')}: {ad.adId}</CardDescription>
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
              {t('ads.details.information')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.description')}:</span>
                <span className="font-medium">{ad.description || t('common.notAvailable')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.created')}:</span>
                <span className="font-medium">{formatDate(ad.creationDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.updated')}:</span>
                <span className="font-medium">{formatDate(ad.updateDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.keywords')}:</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {ad.keywords && ad.keywords.length > 0 ? (
                    ad.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="font-medium">{t('ads.details.noKeywords')}</span>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-medium mb-3 mt-6 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              {t('ads.details.bidding.title')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.bidding.amount')}:</span>
                <span className="font-medium">
                  {ad.bid?.amount ? formatCurrency(ad.bid.amount) : t('common.notAvailable')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.bidding.currency')}:</span>
                <span className="font-medium">{ad.bid?.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-muted-foreground">{t('ads.details.bidding.strategy')}:</span>
                <span className="font-medium">{ad.bid?.strategy || t('ads.details.bidding.manual')}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-purple-500" />
              {t('ads.details.product.title')}
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
                    <span className="text-muted-foreground">{t('ads.details.product.id')}:</span>
                    <span className="font-medium">{product.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.details.product.name')}:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.details.product.price')}:</span>
                    <span className="font-medium">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.details.product.quantity')}:</span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.details.product.category')}:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground">{t('ads.details.product.sellerId')}:</span>
                    <span className="font-medium">{product.sellerId}</span>
                  </div>
                  <div className="py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-muted-foreground block mb-1">{t('ads.details.product.description')}:</span>
                    <p className="text-sm">{product.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  {t('ads.details.product.noInfo')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

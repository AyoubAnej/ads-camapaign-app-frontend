import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CreateAdRequestDto } from '@/types/ad';
import { BidObject, StateObject } from '@/types/campaign';
import { Product } from '@/types/product';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adApi } from '@/lib/adApi';
import { productApi } from '@/lib/productApi';
import { campaignApi } from '@/lib/campaignApi';
import { advertiserApi } from '@/lib/advertiserApi';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Step types
type FormStep = 
  | 'ad-details'
  | 'product-selection'
  | 'keywords-selection'
  | 'bids-budget'
  | 'review';

// Form data interface
interface AdFormData {
  advertiserId?: number;
  productId: string;
  title: string;
  description: string;
  keywords: string[];
  bid: BidObject;
  adState: StateObject;
}

interface CreateAdFormProps {
  campaignId: number;
}

export const CreateAdForm: React.FC<CreateAdFormProps> = ({ campaignId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for current step
  const [currentStep, setCurrentStep] = useState<FormStep>('ad-details');
  
  // State for form data
  const [formData, setFormData] = useState<AdFormData>({
    advertiserId: undefined, // Will be set from campaign data
    productId: '',
    title: '',
    description: '',
    keywords: [],
    bid: {
      amount: 0,
      currency: 'USD',
      strategy: 'CPC'
    },
    adState: {
      isActive: false,
      activatedAt: null,
      deactivatedAt: null,
      reason: ''
    }
  });
  
  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for keyword input
  const [keywordInput, setKeywordInput] = useState('');
  
  // Fetch campaign details to get the advertiser ID (tenantId)
  const { data: campaignData, isLoading: isCampaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      console.log(`Fetching campaign details for ID: ${campaignId}`);
      return await campaignApi.getCampaign(campaignId);
    },
    enabled: !!campaignId
  });

  // Set the advertiser ID from the campaign's tenant ID
  useEffect(() => {
    if (campaignData && campaignData.tenantId) {
      console.log(`Setting advertiser ID from campaign: ${campaignData.tenantId}`);
      setFormData(prev => ({
        ...prev,
        advertiserId: campaignData.tenantId
      }));
    }
  }, [campaignData]);
  
  // Fetch advertiser details to get the seller ID
  const { data: advertiserDetails, isLoading: isAdvertiserLoading } = useQuery({
    queryKey: ['advertiser', formData.advertiserId],
    queryFn: async () => {
      if (formData.advertiserId) {
        console.log(`Fetching advertiser details for ID: ${formData.advertiserId}`);
        return await advertiserApi.getAdvertiserById(formData.advertiserId.toString());
      }
      return null;
    },
    enabled: !!formData.advertiserId
  });
  
  // Get the seller ID from the advertiser details
  const sellerId = advertiserDetails?.sellerId || null;
  
  // Fetch products query based on sellerId
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', sellerId],
    queryFn: async () => {
      if (sellerId) {
        // Use the specified endpoint to get products by seller ID
        console.log(`Fetching products for seller ID: ${sellerId}`);
        // Convert sellerId to number if it's a string
        const sellerIdNumber = typeof sellerId === 'string' ? parseInt(sellerId) : sellerId;
        return await productApi.getProductsBySellerId(sellerIdNumber);
      } else {
        console.log('No seller ID available, cannot fetch products');
        return [];
      }
    },
    enabled: !!sellerId && (currentStep === 'product-selection' || currentStep === 'review')
  });
  
  // Navigate to the appropriate campaigns page based on user role
  const navigateToCampaigns = () => {
    const userRole = user?.role;
    
    if (userRole === 'ADMIN') {
      navigate('/admin/campaigns');
    } else if (userRole === 'ADVERTISER') {
      navigate('/advertiser/campaigns');
    } else if (userRole === 'AGENCY_MANAGER') {
      navigate('/agency/campaigns');
    } else {
      // Fallback to a common route if role is unknown
      navigate('/campaigns');
    }
  };

  // Mutation for creating ad
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateAdRequestDto) => {
      return await adApi.createAd(campaignId, data);
    },
    onSuccess: () => {
      toast({
        title: `${t('ads.addCreation.successTitle')}`,
        description: `${t('ads.addCreation.successMessage')}`,
        variant: "default",
      });
      
      // Navigate to the appropriate campaigns page based on user role
      navigateToCampaigns();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form field changes
  const handleChange = (field: keyof AdFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for the field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle adding a keyword
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 'ad-details':
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        break;
        
      case 'product-selection':
        if (!formData.productId) {
          newErrors.productId = 'Product selection is required';
        }
        break;
        
      case 'bids-budget':
        if (formData.bid.amount <= 0) {
          newErrors.bidAmount = 'Bid amount must be greater than 0';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return;
    
    switch (currentStep) {
      case 'ad-details':
        setCurrentStep('product-selection');
        break;
      case 'product-selection':
        setCurrentStep('keywords-selection');
        break;
      case 'keywords-selection':
        setCurrentStep('bids-budget');
        break;
      case 'bids-budget':
        setCurrentStep('review');
        break;
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    switch (currentStep) {
      case 'product-selection':
        setCurrentStep('ad-details');
        break;
      case 'keywords-selection':
        setCurrentStep('product-selection');
        break;
      case 'bids-budget':
        setCurrentStep('keywords-selection');
        break;
      case 'review':
        setCurrentStep('bids-budget');
        break;
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateStep()) return;
    
    const adData: CreateAdRequestDto = {
      productId: formData.productId,
      title: formData.title,
      description: formData.description,
      keywords: formData.keywords,
      adState: formData.adState,
      bid: formData.bid
    };
    
    mutate(adData);
  };
  
  const {t} = useTranslation();

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'ad-details':
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="advertiser">{t('ads.addCreation.labels.advertiser')}</Label>
              {isCampaignLoading ? (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">{t('ads.addCreation.labels.loadingCampaignInfo')}</span>
                </div>
              ) : isAdvertiserLoading ? (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">{t('ads.addCreation.labels.loadingAdvertiserInfo')}</span>
                </div>
              ) : advertiserDetails ? (
                <div className="p-2 border rounded-md mt-2">
                  <p className="font-medium">{advertiserDetails.shopName || `Advertiser ID: ${advertiserDetails.id}`}</p>
                  <p className="text-sm text-muted-foreground">{t('ads.addCreation.placeholders.advertiserRelatedAd')}</p>
                </div>
              ) : (
                <div className="p-2 border border-red-200 bg-red-50 rounded-md mt-2">
                  <p className="text-sm text-red-500">{t('ads.addCreation.errors.advertiserLoadError')}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <Label htmlFor="title">{t('ads.addCreation.labels.title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('ads.addCreation.placeholders.title')}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>
            
            <div className="mb-4">
              <Label htmlFor="description">{t('ads.addCreation.labels.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('ads.addCreation.placeholders.description')}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        );
        
      case 'product-selection':
        return (
          <div className="space-y-4">
            {isProductsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>{t('ads.addCreation.labels.loadingProducts')}</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-2">{t('ads.addCreation.labels.noProductsForAdvertiser')}</p>
                <p className="text-sm">{t('ads.addCreation.labels.ensureAdvertiserHasProducts')}</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Label htmlFor="product">{t('ads.addCreation.labels.selectProduct')}</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => handleChange('productId', value)}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder={t('ads.addCreation.labels.selectProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productId && (
                    <p className="text-sm text-red-500 mt-1">{errors.productId}</p>
                  )}
                </div>
                
                {formData.productId && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">{t('ads.addCreation.selectedProduct.selectedProductDetails')}</h3>
                    {products
                      .filter((product) => product.id === formData.productId)
                      .map((product) => (
                        <div key={product.id} className="border rounded-md p-4">
                          {product.imageUrl && (
                            <div className="mb-4">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-48 object-cover rounded-md"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">{t('ads.addCreation.selectedProduct.name')}</p>
                              <p>{product.name}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('ads.addCreation.selectedProduct.price')}</p>
                              <p>${product.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('ads.addCreation.selectedProduct.category')}</p>
                              <p>{product.category}</p>
                            </div>
                            <div>
                              <p className="font-medium">{t('ads.addCreation.selectedProduct.quantity')}</p>
                              <p>{product.quantity}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-medium">{t('ads.addCreation.selectedProduct.description')}</p>
                              <p className="text-sm">{product.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      case 'keywords-selection':
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="keywords">{t('ads.addCreation.labels.keywords')}</Label>
              <p className="text-sm text-muted-foreground mb-2">
                {t('ads.addCreation.labels.keywordsDesc')}
              </p>
              
              <div className="flex mb-2">
                <Input
                  id="keywords"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder={t('ads.addCreation.placeholders.keywords')}
                  className="mr-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddKeyword}>{t('ads.addCreation.addBtn')}</Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.keywords.length > 0 ? (
                  formData.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="px-3 py-1">
                      {keyword}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveKeyword(keyword)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('ads.addCreation.labels.noKeywords')}</p>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                {t('ads.addCreation.labels.keywordCondition')}
              </p>
            </div>
          </div>
        );
        
      case 'bids-budget':
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="bidAmount">{t('ads.fields.bidAmount')}</Label>
              <div className="flex items-center">
                <span className="mr-2">$</span>
                <Input
                  id="bidAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.bid.amount}
                  onChange={(e) => handleChange('bid', { ...formData.bid, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              {errors.bidAmount && (
                <p className="text-sm text-red-500 mt-1">{errors.bidAmount}</p>
              )}
            </div>
            
            <div className="mb-4">
              <Label htmlFor="bidStrategy">{t('ads.fields.bidStrategy')}</Label>
              <Select
                value={formData.bid.strategy}
                onValueChange={(value) => handleChange('bid', { ...formData.bid, strategy: value })}
              >
                <SelectTrigger id="bidStrategy">
                  <SelectValue placeholder={t('ads.addCreation.placeholders.bidStrategy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPC">Cost Per Click (CPC)</SelectItem>
                  <SelectItem value="CPM">Cost Per Mille (CPM)</SelectItem>
                  <SelectItem value="CPA">Cost Per Action (CPA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="currency">{t('ads.addCreation.labels.currency')}</Label>
              <Select
                value={formData.bid.currency}
                onValueChange={(value) => handleChange('bid', { ...formData.bid, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder={t('ads.addCreation.placeholders.currency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="adState"
                  checked={formData.adState.isActive}
                  onCheckedChange={(checked) => {
                    const now = new Date().toISOString();
                    handleChange('adState', {
                      ...formData.adState,
                      isActive: checked,
                      activatedAt: checked ? now : null,
                      deactivatedAt: !checked ? now : null,
                    });
                  }}
                />
                <Label htmlFor="adState">{t('ads.addCreation.labels.activateAd')}</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('ads.addCreation.placeholders.activateAdNote')}
              </p>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{t('ads.addCreation.steps.step1')}:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">{t('ads.fields.title')}</p>
                  <p>{formData.title}</p>
                </div>
                <div>
                  <p className="font-medium">{t('ads.fields.description')}:</p>
                  <p>{formData.description}</p>
                </div>
              </div>
              
              <div className="mt-2">
                <p className="font-medium">{t('ads.addCreation.steps.step3')}:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.keywords.length > 0 ? (
                    formData.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('ads.addCreation.labels.noKeywordsAutoGenerated')}</p>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">{t('ads.addCreation.steps.step2')}</h3>
              {products
                .filter((product) => product.id === formData.productId)
                .map((product) => (
                  <div key={product.id} className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{t('ads.addCreation.selectedProduct.name')}:</p>
                      <p>{product.name}</p>
                    </div>
                    <div>
                      <p className="font-medium">{t('ads.addCreation.selectedProduct.price')}:</p>
                      <p>${product.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-medium">{t('ads.addCreation.selectedProduct.category')}:</p>
                      <p>{product.category}</p>
                    </div>
                  </div>
                ))}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">{t('ads.addCreation.steps.step4')}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">{t('ads.addCreation.labels.amount')}:</p>
                  <p>{formData.bid.currency} {formData.bid.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">{t('ads.addCreation.labels.strategy')}:</p>
                  <p>{formData.bid.strategy}</p>
                </div>
                <div>
                  <p className="font-medium">{t('campaigns.fields.status')}:</p>
                  <Badge variant={formData.adState.isActive ? "default" : "secondary"}>
                    {formData.adState.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'ad-details' as FormStep, label: `${t('ads.addCreation.steps.step1')}` },
      { key: 'product-selection' as FormStep, label: `${t('ads.addCreation.steps.step2')}` },
      { key: 'keywords-selection' as FormStep, label: `${t('ads.addCreation.steps.step3')}` },
      { key: 'bids-budget' as FormStep, label: `${t('ads.addCreation.steps.step4')}` },
      { key: 'review' as FormStep, label: `${t('ads.addCreation.steps.step5')}` }
    ];
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div 
              className={`flex flex-col items-center ${
                currentStep === step.key
                  ? 'text-primary'
                  : steps.findIndex(s => s.key === currentStep) > index
                  ? 'text-primary/70'
                  : 'text-gray-400'
              }`}
            >
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 ${
                  currentStep === step.key
                    ? 'bg-primary text-white'
                    : steps.findIndex(s => s.key === currentStep) > index
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs">{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`w-12 h-1 mx-1 ${
                  steps.findIndex(s => s.key === currentStep) > index
                    ? 'bg-primary/50'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('ads.addCreation.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}
        {renderStepContent()}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 'ad-details'}
        >
          {t('ads.addCreation.previousBtn')}
        </Button>
        
        {currentStep === 'review' ? (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('ads.addCreation.creating')}
              </>
            ) : (
              `${t('ads.addCreation.submitBtn')}`
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {t('ads.addCreation.nextBtn')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

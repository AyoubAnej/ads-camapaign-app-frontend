import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CreateAdRequestDto } from '@/types/ad';
import { BidObject, StateObject } from '@/types/campaign';
import { Product } from '@/types/product';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adApi } from '@/lib/adApi';
import { productApi } from '@/lib/productApi';
import { advertiserApi, Advertiser as AdvertiserType } from '@/lib/advertiserApi';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

// Using the Advertiser type from advertiserApi.ts

// Step types
type FormStep = 
  | 'advertiser-selection'
  | 'ad-details'
  | 'product-selection'
  | 'bids-budget'
  | 'review';

// Form data interface
interface AdFormData {
  advertiserId?: number;
  productId: string;
  title: string;
  description: string;
  mediaUrl: string;
  redirectUrl: string;
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
  const userRole = user?.role;
  
  // State for current step
  const [currentStep, setCurrentStep] = useState<FormStep>(
    userRole === 'ADMIN' || userRole === 'AGENCY_MANAGER' 
      ? 'advertiser-selection' 
      : 'ad-details'
  );
  
  // State for form data
  const [formData, setFormData] = useState<AdFormData>({
    advertiserId: userRole === 'ADVERTISER' ? user?.advertiserId : undefined,
    productId: '',
    title: '',
    description: '',
    mediaUrl: '',
    redirectUrl: '',
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
  
  // Fetch advertisers from API
  const { data: advertisers = [], isLoading: isAdvertisersLoading } = useQuery({
    queryKey: ['advertisers'],
    queryFn: async () => {
      return await advertiserApi.getAllAdvertisers();
    },
    enabled: userRole === 'ADMIN' || userRole === 'AGENCY_MANAGER'
  });
  
  // Get the selected advertiser's sellerId if in ADMIN or AGENCY_MANAGER role
  const selectedAdvertiserId = formData.advertiserId;
  const selectedAdvertiser = selectedAdvertiserId ? 
    advertisers.find(adv => adv.id === selectedAdvertiserId) : null;
  const sellerId = userRole === 'ADVERTISER' ? 
    user?.sellerId : 
    (selectedAdvertiser?.sellerId || null);
  
  // Fetch products query based on sellerId
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', sellerId],
    queryFn: async () => {
      if (sellerId) {
        // Use the specified endpoint to get products by seller ID
        return await productApi.getProductsBySellerId(sellerId);
      } else {
        return [];
      }
    },
    enabled: !!sellerId && (currentStep === 'product-selection' || currentStep === 'review')
  });
  
  // Mutation for creating ad
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateAdRequestDto) => {
      return await adApi.createAd(campaignId, data);
    },
    onSuccess: () => {
      toast({
        title: "Ad Created Successfully",
        description: "Your ad has been created and is now live.",
        variant: "default",
      });
      
      // Navigate based on user role
      if (userRole === 'ADMIN') {
        navigate(`/admin/campaigns`);
      } else if (userRole === 'ADVERTISER') {
        navigate(`/advertiser/campaigns`);
      } else if (userRole === 'AGENCY_MANAGER') {
        navigate(`/agency/campaigns`);
      } else {
        // Fallback to campaigns/campaignId/ads as a generic route
        navigate(`/campaigns/${campaignId}/ads`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error Creating Ad",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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
      case 'advertiser-selection':
        if (!formData.advertiserId) {
          newErrors.advertiserId = 'Please select an advertiser';
        }
        break;
        
      case 'ad-details':
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        }
        break;
        
      case 'product-selection':
        if (!formData.productId) {
          newErrors.productId = 'Please select a product';
        }
        break;
        
      case 'bids-budget':
        if (formData.bid.amount <= 0) {
          newErrors.bidAmount = 'Bid amount must be greater than 0';
        }
        if (!formData.bid.strategy) {
          newErrors.bidStrategy = 'Please select a bid strategy';
        }
        if (formData.adState.isActive && !formData.adState.activatedAt) {
          newErrors.activatedAt = 'Activation date is required when ad is active';
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
      case 'advertiser-selection':
        setCurrentStep('ad-details');
        break;
      case 'ad-details':
        setCurrentStep('product-selection');
        break;
      case 'product-selection':
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
      case 'ad-details':
        if (userRole === 'ADMIN' || userRole === 'AGENCY_MANAGER') {
          setCurrentStep('advertiser-selection');
        }
        break;
      case 'product-selection':
        setCurrentStep('ad-details');
        break;
      case 'bids-budget':
        setCurrentStep('product-selection');
        break;
      case 'review':
        setCurrentStep('bids-budget');
        break;
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    // Prepare the DTO
    const createAdDto: CreateAdRequestDto = {
      productId: formData.productId,
      title: formData.title,
      description: formData.description,
      mediaUrl: formData.mediaUrl,
      redirectUrl: formData.redirectUrl,
      adState: formData.adState,
      bid: formData.bid
    };
    
    // Submit the form using the mutation
    mutate(createAdDto);
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'advertiser-selection':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advertiser">Select Advertiser</Label>
              {isAdvertisersLoading ? (
                <div className="text-center py-4">Loading advertisers...</div>
              ) : (
                <Select
                  value={formData.advertiserId?.toString()}
                  onValueChange={(value) => handleChange('advertiserId', parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an advertiser" />
                  </SelectTrigger>
                  <SelectContent>
                    {advertisers.map((advertiser) => (
                      <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                        {`${advertiser.firstName} ${advertiser.lastName} (${advertiser.shopName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.advertiserId && (
                <p className="text-sm text-red-500">{errors.advertiserId}</p>
              )}
            </div>
          </div>
        );
        
      case 'ad-details':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter ad title"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter ad description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Media URL</Label>
              <Input
                id="mediaUrl"
                value={formData.mediaUrl}
                onChange={(e) => handleChange('mediaUrl', e.target.value)}
                placeholder="Enter media URL"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL</Label>
              <Input
                id="redirectUrl"
                value={formData.redirectUrl}
                onChange={(e) => handleChange('redirectUrl', e.target.value)}
                placeholder="Enter redirect URL"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <div className="flex gap-2">
                <Input
                  id="keywords"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keywords"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddKeyword} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'product-selection':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Select Product <span className="text-red-500">*</span></Label>
              {isProductsLoading ? (
                <div className="text-center py-4">Loading products...</div>
              ) : (
                <Select
                  value={formData.productId}
                  onValueChange={(value) => handleChange('productId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.productId && (
                <p className="text-sm text-red-500">{errors.productId}</p>
              )}
            </div>
            
            {formData.productId && products.length > 0 && products.some(p => p.id === formData.productId) && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="font-medium">Selected Product Details</h4>
                {products.filter(p => p.id === formData.productId).map(product => (
                  <div key={product.id} className="mt-2 text-sm">
                    <p><strong>Name:</strong> {product.name}</p>
                    <p><strong>Description:</strong> {product.description}</p>
                    <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                    <p><strong>Category:</strong> {product.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'bids-budget':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bid Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">Bid Amount <span className="text-red-500">*</span></Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-700 border border-r-0 dark:border-gray-600 rounded-l-md">
                      {formData.bid.currency}
                    </div>
                    <Input
                      id="bidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bid.amount || ''}
                      onChange={(e) => handleChange('bid', {
                        ...formData.bid,
                        amount: parseFloat(e.target.value) || 0
                      })}
                      className="rounded-l-none"
                    />
                  </div>
                  {errors.bidAmount && (
                    <p className="text-sm text-red-500">{errors.bidAmount}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bidCurrency">Currency</Label>
                  <Select
                    value={formData.bid.currency}
                    onValueChange={(value) => handleChange('bid', {
                      ...formData.bid,
                      currency: value
                    })}
                  >
                    <SelectTrigger id="bidCurrency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bidStrategy">Bid Strategy <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.bid.strategy}
                  onValueChange={(value) => handleChange('bid', {
                    ...formData.bid,
                    strategy: value
                  })}
                >
                  <SelectTrigger id="bidStrategy">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPC">Cost Per Click (CPC)</SelectItem>
                    <SelectItem value="CPM">Cost Per Mille (CPM)</SelectItem>
                    <SelectItem value="CPA">Cost Per Action (CPA)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bidStrategy && (
                  <p className="text-sm text-red-500">{errors.bidStrategy}</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ad State</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.adState.isActive}
                  onCheckedChange={(checked) => {
                    const now = new Date().toISOString();
                    handleChange('adState', {
                      ...formData.adState,
                      isActive: checked,
                      activatedAt: checked ? now : null
                    });
                  }}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              {formData.adState.isActive && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activatedAt">Activation Date <span className="text-red-500">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.adState.activatedAt && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.adState.activatedAt ? format(new Date(formData.adState.activatedAt), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                        <Calendar
                          mode="single"
                          selected={formData.adState.activatedAt ? new Date(formData.adState.activatedAt) : undefined}
                          onSelect={(date) => handleChange('adState', {
                            ...formData.adState,
                            activatedAt: date ? date.toISOString() : null
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.activatedAt && (
                      <p className="text-sm text-red-500">{errors.activatedAt}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="deactivatedAt">Deactivation Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.adState.deactivatedAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.adState.deactivatedAt ? format(new Date(formData.adState.deactivatedAt), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                    <Calendar
                      mode="single"
                      selected={formData.adState.deactivatedAt ? new Date(formData.adState.deactivatedAt) : undefined}
                      onSelect={(date) => handleChange('adState', {
                        ...formData.adState,
                        deactivatedAt: date ? date.toISOString() : null
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.adState.reason || ''}
                  onChange={(e) => handleChange('adState', {
                    ...formData.adState,
                    reason: e.target.value
                  })}
                  placeholder="Enter reason for state"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Ad Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Title:</p>
                  <p>{formData.title}</p>
                </div>
                {formData.description && (
                  <div>
                    <p className="font-medium">Description:</p>
                    <p>{formData.description}</p>
                  </div>
                )}
                {formData.mediaUrl && (
                  <div>
                    <p className="font-medium">Media URL:</p>
                    <p className="truncate">{formData.mediaUrl}</p>
                  </div>
                )}
                {formData.redirectUrl && (
                  <div>
                    <p className="font-medium">Redirect URL:</p>
                    <p className="truncate">{formData.redirectUrl}</p>
                  </div>
                )}
              </div>
              
              {formData.keywords.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Keywords:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Product</h3>
              {products.filter(p => p.id === formData.productId).map(product => (
                <div key={product.id} className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Name:</p>
                    <p>{product.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Category:</p>
                    <p>{product.category}</p>
                  </div>
                  <div>
                    <p className="font-medium">Price:</p>
                    <p>${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Bid Settings</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Amount:</p>
                  <p>{formData.bid.currency} {formData.bid.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Strategy:</p>
                  <p>{formData.bid.strategy}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Ad State</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Status:</p>
                  <Badge variant={formData.adState.isActive ? "default" : "secondary"}>
                    {formData.adState.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {formData.adState.activatedAt && (
                  <div>
                    <p className="font-medium">Activated At:</p>
                    <p>{format(new Date(formData.adState.activatedAt), "PPP")}</p>
                  </div>
                )}
                {formData.adState.deactivatedAt && (
                  <div>
                    <p className="font-medium">Deactivated At:</p>
                    <p>{format(new Date(formData.adState.deactivatedAt), "PPP")}</p>
                  </div>
                )}
                {formData.adState.reason && (
                  <div className="col-span-2">
                    <p className="font-medium">Reason:</p>
                    <p>{formData.adState.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      ...(userRole === 'ADMIN' || userRole === 'AGENCY_MANAGER' 
        ? [{ key: 'advertiser-selection' as FormStep, label: 'Advertiser' }] 
        : []
      ),
      { key: 'ad-details' as FormStep, label: 'Ad Details' },
      { key: 'product-selection' as FormStep, label: 'Product' },
      { key: 'bids-budget' as FormStep, label: 'Bids & Budget' },
      { key: 'review' as FormStep, label: 'Review' }
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
        <CardTitle className="text-center">Create New Ad</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}
        {renderStepContent()}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={
            currentStep === 'advertiser-selection' ||
            (currentStep === 'ad-details' && userRole === 'ADVERTISER')
          }
        >
          Previous
        </Button>
        
        {currentStep === 'review' ? (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};



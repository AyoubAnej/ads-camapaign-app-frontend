import axios from 'axios';
import { 
  CreateAdRequestDto, 
  UpdateAdRequestDto, 
  GetAdResponseDto,
  SelectedProductsRequestDto,
  PaginationResponse,
  AdPaginationParams
} from '@/types/ad';

// Create ad axios instance with the same base URL as campaign
// since ads are accessed via campaign endpoints
export const adAxios = axios.create({
  baseURL: 'http://localhost:5284/campaigns',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
adAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptors for error handling
adAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Ad API Error:', error);
    return Promise.reject(error);
  }
);

// Ad API service
export const adApi = {
  // Get all ads for a campaign
  getAds: async (campaignId: number): Promise<GetAdResponseDto[]> => {
    try {
      console.log(`Fetching ads for campaign ${campaignId}`);
      const response = await adAxios.get(`/${campaignId}/ads`);
      console.log('Ads response:', response.data);
      return Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
    } catch (error) {
      console.error(`Error fetching ads for campaign ${campaignId}:`, error);
      throw error;
    }
  },

  // Get ads with pagination
  getAdsWithPagination: async (campaignId: number, params: AdPaginationParams): Promise<PaginationResponse<GetAdResponseDto>> => {
    try {
      const { page, pageSize, searchTerm, statusFilter } = params;
      let url = `/${campaignId}/ads?page=${page}&pageSize=${pageSize}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (statusFilter && statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        url += `&isActive=${isActive}`;
      }
      
      console.log(`Fetching paginated ads for campaign ${campaignId} with params:`, params);
      const response = await adAxios.get(url);
      console.log('Paginated ads response:', response.data);
      
      // If the backend isn't properly handling the search and filter, implement client-side filtering
      let filteredData = response.data;
      
      // If we have items and the backend didn't filter properly
      if (filteredData.items && Array.isArray(filteredData.items)) {
        let filteredItems = [...filteredData.items];
        
        // Apply client-side search if searchTerm is provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredItems = filteredItems.filter(ad => 
            ad.title.toLowerCase().includes(searchLower) ||
            (ad.description && ad.description.toLowerCase().includes(searchLower))
          );
        }
        
        // Apply client-side status filter if statusFilter is provided and not 'all'
        if (statusFilter && statusFilter !== 'all') {
          const isActive = statusFilter === 'active';
          filteredItems = filteredItems.filter(ad => ad.adState?.isActive === isActive);
        }
        
        // Update the response with filtered items
        const totalFilteredCount = filteredItems.length;
        const totalFilteredPages = Math.ceil(totalFilteredCount / pageSize);
        
        // Return filtered data with updated pagination info
        return {
          ...filteredData,
          items: filteredItems,
          totalCount: totalFilteredCount,
          totalPages: totalFilteredPages,
          hasPrevious: page > 1,
          hasNext: page < totalFilteredPages
        };
      }
      
      return filteredData;
    } catch (error) {
      console.error(`Error fetching paginated ads for campaign ${campaignId}:`, error);
      throw error;
    }
  },

  // Get a specific ad
  getAd: async (adId: number): Promise<GetAdResponseDto> => {
    const response = await adAxios.get(`/ads/${adId}`);
    return response.data;
  },

  // Create a new ad
  createAd: async (campaignId: number, ad: CreateAdRequestDto): Promise<GetAdResponseDto> => {
    try {
      console.log('Creating ad with payload:', JSON.stringify(ad, null, 2));
      console.log('Campaign ID:', campaignId);
      const response = await adAxios.post(`/${campaignId}/ads`, ad);
      console.log('Ad creation successful, response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating ad:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  },

  // Update an existing ad
  updateAd: async (adId: number, ad: UpdateAdRequestDto): Promise<GetAdResponseDto> => {
    const response = await adAxios.put(`/ads/${adId}`, ad);
    return response.data;
  },

  // Delete an ad
  deleteAd: async (adId: number): Promise<void> => {
    await adAxios.delete(`/ads/${adId}`);
  },

  // Get ads by productId
  getAdsByProductId: async (productId: string): Promise<GetAdResponseDto[]> => {
    const response = await adAxios.get(`/products/${productId}/ads`);
    return response.data;
  },

  // Create ad for seller
  createAdForSeller: async (campaignId: number, sellerId: number, ad: CreateAdRequestDto): Promise<GetAdResponseDto> => {
    const response = await adAxios.post(`/${campaignId}/seller/${sellerId}/ads`, ad);
    return response.data;
  },

  // Select products for seller
  selectProductsForSeller: async (campaignId: number, sellerId: number, productsRequest: SelectedProductsRequestDto): Promise<GetAdResponseDto[]> => {
    const response = await adAxios.post(`/${campaignId}/seller/${sellerId}/select-products`, productsRequest);
    return response.data;
  },

  // Get seller products
  getSellerProducts: async (sellerId: number): Promise<any[]> => {
    const response = await adAxios.get(`/seller/${sellerId}/products`);
    return response.data;
  }
};

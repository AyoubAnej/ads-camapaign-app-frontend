import { sellerAxios } from './axios';
import { Seller } from '@/types/seller';

export const sellersApi = {
  // Get all sellers
  getAllSellers: async (isRegistered?: boolean): Promise<Seller[]> => {
    try {
      const params = isRegistered !== undefined ? { isRegistered } : {};
      const response = await sellerAxios.get('/', { params });
      console.log('Raw sellers API response:', response);
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        return response.data;
      } 
      
      // If response.data has an 'items' property (paginated response)
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      
      console.error('Unexpected sellers API response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching sellers:', error);
      return [];
    }
  },
  
  // Get a seller by ID
  getSellerById: async (sellerId: string): Promise<Seller> => {
    const response = await sellerAxios.get(`/${sellerId}`);
    return response.data;
  },

  // Get a seller by email
  getSellerByEmail: async (email: string): Promise<Seller> => {
    const response = await sellerAxios.get(`/email/${email}`);
    return response.data;
  }
};

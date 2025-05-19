import axios from 'axios';
import { Product } from '@/types/product';

// Create product axios instance
export const productAxios = axios.create({
  baseURL: 'http://localhost:5041/api/v1/Product', // Product API endpoint
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
productAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptors for error handling
productAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Product API Error:', error);
    return Promise.reject(error);
  }
);

// Product API service
export const productApi = {
  // Get a product by ID
  getProductById: async (productId: string): Promise<Product> => {
    try {
      const response = await productAxios.get(`/${productId}`);
      return mapProductDtoToProduct(response.data);
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  // Get products by seller ID
  getProductsBySellerId: async (sellerId: number): Promise<Product[]> => {
    try {
      const response = await productAxios.get(`/seller/${sellerId}`);
      return Array.isArray(response.data) 
        ? response.data.map(mapProductDtoToProduct) 
        : [];
    } catch (error) {
      console.error(`Error fetching products for seller ${sellerId}:`, error);
      return [];
    }
  },
  
  // Get products by name
  getProductsByName: async (name: string): Promise<Product[]> => {
    try {
      const response = await productAxios.get(`/name/${encodeURIComponent(name)}`);
      return Array.isArray(response.data) 
        ? response.data.map(mapProductDtoToProduct) 
        : [];
    } catch (error) {
      console.error(`Error fetching products by name ${name}:`, error);
      return [];
    }
  },

  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const response = await productAxios.get('/products');
      return Array.isArray(response.data) 
        ? response.data.map(mapProductDtoToProduct) 
        : [];
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  },
  
  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const response = await productAxios.get(`/category/${encodeURIComponent(category)}`);
      return Array.isArray(response.data) 
        ? response.data.map(mapProductDtoToProduct) 
        : [];
    } catch (error) {
      console.error(`Error fetching products by category ${category}:`, error);
      return [];
    }
  }
};

// Helper function to map ProductDto from API to our Product interface
const mapProductDtoToProduct = (dto: any): Product => {
  return {
    id: dto.productId.toString(),
    sellerId: dto.sellerId,
    name: dto.name,
    description: dto.description,
    price: dto.price,
    quantity: dto.stockQuantity,
    imageUrl: dto.imageUrl,
    category: dto.category,
    createdAt: dto.createdAt
  };
};

import axios, { AxiosError } from 'axios';
import { 
  CreateCampaignRequestDto, 
  UpdateCampaignRequestDto, 
  GetCampaignResponseDto,
  PaginationResponseDto
} from '@/types/campaign';

// Create campaign axios instance
export const campaignAxios = axios.create({
  baseURL: 'http://localhost:5284/campaigns',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
campaignAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptors for error handling
campaignAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Your session has expired. Please log in again.'));
    } else if (error.response?.status === 403) {
      return Promise.reject(new Error('You do not have permission to access this resource'));
    } else if (error.response?.status === 404) {
      // Let the individual API methods handle 404s since they're often resource-specific
      return Promise.reject(error);
    }
    
    // For other errors, provide a generic message
    const errorMessage = ((error as AxiosError<string>).response?.data) || 'An unexpected error occurred';
    console.error('Campaign API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Campaign API service
export const campaignApi = {
  // Get all campaigns
  getAllCampaigns: async (): Promise<GetCampaignResponseDto[]> => {
    try {
      const response = await campaignAxios.get('');
      return response.data;
    } catch (error) {
      console.error('Error fetching all campaigns:', error);
      throw error;
    }
  },

  // Get campaigns with pagination
  getCampaigns: async (page = 1, pageSize = 10): Promise<PaginationResponseDto<GetCampaignResponseDto>> => {
    try {
      const response = await campaignAxios.get('', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated campaigns:', error);
      throw error;
    }
  },

  // Get a specific campaign by ID
  getCampaign: async (campaignId: number | string): Promise<GetCampaignResponseDto> => {
    try {
      const response = await campaignAxios.get(`/${campaignId}`);
      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        const errorMessage = `Campaign with ID ${campaignId} not found`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      throw error; // Let the interceptor handle other errors
    }
  },

  // Create a new campaign
  createCampaign: async (campaign: CreateCampaignRequestDto): Promise<GetCampaignResponseDto> => {
    try {
      const response = await campaignAxios.post('', campaign);
      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 400) {
        const errorMessage = ((error as AxiosError<string>).response?.data) || 'Invalid campaign data';
        throw new Error(errorMessage);
      }
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  // Update an existing campaign
  updateCampaign: async (campaignId: number | string, campaign: UpdateCampaignRequestDto): Promise<GetCampaignResponseDto> => {
    try {
      const response = await campaignAxios.put(`/${campaignId}`, campaign);
      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      } else if ((error as AxiosError).response?.status === 400) {
        const errorMessage = ((error as AxiosError<string>).response?.data) || 'Invalid campaign data';
        throw new Error(errorMessage);
      } else if ((error as AxiosError).response?.status === 403) {
        throw new Error('You do not have permission to update this campaign');
      }
      console.error(`Error updating campaign ${campaignId}:`, error);
      throw error;
    }
  },

  // Delete a campaign
  deleteCampaign: async (campaignId: number | string): Promise<void> => {
    try {
      await campaignAxios.delete(`/${campaignId}`);
      console.log(`Campaign ${campaignId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting campaign ${campaignId}:`, error);
      throw error;
    }
  }
};

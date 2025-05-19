import axios from 'axios';
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
  (error) => {
    console.error('Campaign API Error:', error);
    return Promise.reject(error);
  }
);

// Campaign API service
export const campaignApi = {
  // Get all campaigns
  getAllCampaigns: async (): Promise<GetCampaignResponseDto[]> => {
    const response = await campaignAxios.get('');
    return response.data;
  },

  // Get campaigns with pagination
  getCampaigns: async (page = 1, pageSize = 10): Promise<PaginationResponseDto<GetCampaignResponseDto>> => {
    const response = await campaignAxios.get('', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Get a specific campaign by ID
  getCampaign: async (campaignId: number | string): Promise<GetCampaignResponseDto> => {
    const response = await campaignAxios.get(`/${campaignId}`);
    return response.data;
  },

  // Create a new campaign
  createCampaign: async (campaign: CreateCampaignRequestDto): Promise<GetCampaignResponseDto> => {
    const response = await campaignAxios.post('', campaign);
    return response.data;
  },

  // Update an existing campaign
  updateCampaign: async (campaignId: number | string, campaign: UpdateCampaignRequestDto): Promise<GetCampaignResponseDto> => {
    const response = await campaignAxios.put(`/${campaignId}`, campaign);
    return response.data;
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

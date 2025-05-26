
import { Agency, CreateAgencyDto, UpdateAgencyDto, PagedResult, AgencyStatus } from '@/types/agency';
import { agencyAxios } from './axios';

interface GetAgenciesParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export const agencyApi = {
  /**
   * Get all agencies with pagination
   * - ADMIN: Can fetch all agencies
   * - AGENCY_MANAGER: Can fetch only their agency
   */
  getAllAgencies: async (params: GetAgenciesParams = {}): Promise<PagedResult<Agency>> => {
    const { page = 1, pageSize = 10, searchTerm = '' } = params;
    const response = await agencyAxios.get<PagedResult<Agency>>('', {
      params: {
        page,
        pageSize,
        searchTerm,
      },
    });
    
    // If the backend isn't properly handling the search, implement client-side filtering
    if (searchTerm && response.data.items) {
      // Apply client-side filtering
      const filteredItems = response.data.items.filter(agency => {
        const searchLower = searchTerm.toLowerCase();
        return (
          agency.name.toLowerCase().includes(searchLower) ||
          agency.phoneNumber.toLowerCase().includes(searchLower) ||
          (agency.website && agency.website.toLowerCase().includes(searchLower)) ||
          (agency.description && agency.description.toLowerCase().includes(searchLower))
        );
      });
      
      // Update pagination information
      const totalFilteredItems = filteredItems.length;
      const totalFilteredPages = Math.ceil(totalFilteredItems / pageSize);
      
      // Return filtered data with updated pagination info
      return {
        ...response.data,
        items: filteredItems,
        totalItems: totalFilteredItems,
        totalPages: totalFilteredPages,
      };
    }
    
    return response.data;
  },

  /**
   * Get a specific agency by ID
   * - ADMIN: Can fetch any agency
   * - AGENCY_MANAGER: Can fetch only their agency
   */
  getAgencyById: async (id: number): Promise<Agency> => {
    const response = await agencyAxios.get<Agency>(`/${id}`);
    return response.data;
  },

  /**
   * Create a new agency
   * - Only accessible to ADMIN users
   */
  createAgency: async (agencyData: CreateAgencyDto): Promise<Agency> => {
    const response = await agencyAxios.post<Agency>('', agencyData);
    return response.data;
  },

  /**
   * Update an existing agency
   * - Only accessible to ADMIN users
   */
  updateAgency: async (id: number, agencyData: UpdateAgencyDto): Promise<Agency> => {
    const response = await agencyAxios.put<Agency>(`/${id}`, agencyData);
    return response.data;
  },

  /**
   * Delete an agency
   * - Only accessible to ADMIN users
   */
  deleteAgency: async (id: number): Promise<void> => {
    await agencyAxios.delete(`/${id}`);
  },

  /**
   * Deactivate an agency
   * - Only accessible to ADMIN users
   */
  deactivateAgency: async (id: number): Promise<Agency> => {
    const response = await agencyAxios.post<Agency>(`/${id}/deactivate`);
    return response.data;
  },

  /**
   * Reactivate an agency
   * - Only accessible to ADMIN users
   */
  reactivateAgency: async (id: number): Promise<Agency> => {
    const response = await agencyAxios.post<Agency>(`/${id}/reactivate`);
    return response.data;
  },
};

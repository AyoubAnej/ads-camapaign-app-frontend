import { advertiserAxios } from "./axios";
import { notificationApi } from "./notificationApi";

export interface Advertiser {
  id: number; // Now using id for frontend
  sellerId: number; // Added to match backend
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  shopName: string;
  role: string; // Will contain backend Role enum values
  status: string; // Will contain backend Status enum values
  agencyId?: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Advertiser;
}

export interface RegisterAdvertiserRequest {
  sellerId: number; // Added to match RegisterAdvertiserDto
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  shopName: string;
  role: string;
  agencyId?: number | null;
}

// Updated to match backend field names exactly
const normalizeAdvertiserData = (data: any): Advertiser => {
  // Log the raw data for debugging
  console.log('Raw advertiser data:', data);
  
  return {
    id: data.advertiserId || data.AdvertiserId || null, // Map advertiserId to id for frontend compatibility
    sellerId: data.sellerId || data.SellerId || null, // Added sellerId
    firstName: data.firstName || data.FirstName || "",
    lastName: data.lastName || data.LastName || "",
    email: data.email || data.Email || "",
    phoneNumber: data.phoneNumber || data.PhoneNumber || "",
    address: data.address || data.Address || "",
    shopName: data.shopName || data.ShopName || "",
    role: data.role || data.Role || "ADVERTISER",
    status: data.status || data.Status || "ACTIVE",
    agencyId: data.agencyId || data.AgencyId || null,
  };
};

export const advertiserApi = {
  getAllAdvertisers: async (): Promise<Advertiser[]> => {
    try {
      const response = await advertiserAxios.get("/advertisers");
      console.log("Raw advertisers API response:", response.data);

      if (response.data.items && Array.isArray(response.data.items)) {
        console.log("Processing items array:", response.data.items);
        return response.data.items.map(normalizeAdvertiserData);
      }
      
      // If the response is a direct array
      if (Array.isArray(response.data)) {
        console.log("Processing direct array:", response.data);
        return response.data.map(normalizeAdvertiserData);
      }
      
      console.error("API returned unexpected data format:", response.data);
      return [];
    } catch (error) {
      console.error("Failed to fetch advertisers:", error);
      return [];
    }
  },

  getAdvertiserById: async (advertiserId: string): Promise<Advertiser> => {
    try {
      const response = await advertiserAxios.get(`/${advertiserId}`);
      return normalizeAdvertiserData(response.data);
    } catch (error) {
      console.error(`Failed to fetch advertiser ${advertiserId}:`, error);
      throw error;
    }
  },

  updateAdvertiser: async (
    advertiserId: number,
    data: Partial<Advertiser>
  ): Promise<Advertiser> => {
    try {
      const response = await advertiserAxios.put(`/${advertiserId}`, data);
      const updatedAdvertiser = normalizeAdvertiserData(response.data);
      
      // Create a notification for the updated advertiser
      try {
        // Create different notification messages based on role
        const role = updatedAdvertiser.role;
        let notificationType = 'Updated';
        let message = 'Your account information has been updated';
        
        if (role === 'ADMIN') {
          notificationType = 'AdminUpdated';
          message = 'Your admin account information has been updated';
        } else if (role === 'AGENCY_MANAGER') {
          notificationType = 'AgencyManagerUpdated';
          message = 'Your agency manager account information has been updated';
        }
        
        await notificationApi.createNotification(
          advertiserId,
          message,
          notificationType as any,
          updatedAdvertiser.agencyId
        );
      } catch (notificationError) {
        // Log but don't throw the error to avoid breaking the update flow
        console.error('Failed to create notification for account update:', notificationError);
      }
      
      return updatedAdvertiser;
    } catch (error) {
      console.error(`Failed to update advertiser ${advertiserId}:`, error);
      throw error;
    }
  },

  deleteAdvertiser: async (advertiserId: number): Promise<void> => {
    try {
      await advertiserAxios.delete(`/${advertiserId}/delete`);
    } catch (error) {
      console.error(`Failed to delete advertiser ${advertiserId}:`, error);
      throw error;
    }
  },

  deactivateAdvertiser: async (advertiserId: number): Promise<void> => {
    try {
      await advertiserAxios.delete(`/${advertiserId}/deactivate`);
    } catch (error) {
      console.error(`Failed to deactivate advertiser ${advertiserId}:`, error);
      throw error;
    }
  },

  reactivateAdvertiser: async (advertiserId: number): Promise<void> => {
    try {
      await advertiserAxios.delete(`/${advertiserId}/reactivate`);
    } catch (error) {
      console.error(`Failed to reactivate advertiser ${advertiserId}:`, error);
      throw error;
    }
  },

  registerAdvertiser: async (
    data: RegisterAdvertiserRequest
  ): Promise<Advertiser> => {
    try {
      // Validate sellerId is present
      if (!data.sellerId) {
        console.error("Missing sellerId in registerAdvertiser request:", data);
        throw new Error("SellerId is required for registration");
      }
      
      // Log the request data for debugging
      console.log("Registering advertiser with data:", JSON.stringify(data));
      
      const response = await advertiserAxios.post("/register", data);
      return normalizeAdvertiserData(response.data);
    } catch (error) {
      console.error("Failed to register advertiser:", error);
      throw error;
    }
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('Attempting login with:', data.email);
      
      // Format the request body to match the AdvertiserLoginDto exactly
      const requestBody = {
        Email: data.email,
        Password: data.password
      };
      
      console.log('Sending login request with body:', requestBody);
      
      // First, get the token from the login endpoint
      const loginResponse = await advertiserAxios.post("/login", requestBody);
      console.log('Raw login response:', loginResponse);
      
      // Extract the token from the response
      // Based on the backend code, the response is just the token string directly
      let token;
      if (typeof loginResponse.data === 'string') {
        token = loginResponse.data;
      } else if (loginResponse.data && loginResponse.data.token) {
        token = loginResponse.data.token;
      } else {
        console.error('Unexpected login response format:', loginResponse.data);
        throw new Error('Invalid response format from server');
      }
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      console.log('Successfully extracted token:', token);
      
      // Set the token in localStorage so it's included in the next request
      localStorage.setItem('token', token);
      
      // Now fetch the user data
      // Based on the backend code, we need to get the user by email
      try {
        // Try to get the user by email first
        console.log('Attempting to fetch user by email:', data.email);
        const userResponse = await advertiserAxios.get(`/email/${data.email}`);
        console.log('User data response:', userResponse.data);
        
        // Normalize the user data
        const user = normalizeAdvertiserData(userResponse.data);
        
        return {
          token,
          user,
        };
      } catch (userError) {
        console.error('Failed to fetch user by email:', userError);
        
        // Try to get the current user using the token we just received
        try {
          console.log('Attempting to fetch current user with token');
          const currentUserResponse = await advertiserAxios.get('/me');
          console.log('Current user response:', currentUserResponse.data);
          
          const user = normalizeAdvertiserData(currentUserResponse.data);
          
          return {
            token,
            user,
          };
        } catch (currentUserError) {
          console.error('Failed to fetch current user:', currentUserError);
          
          // Extract role information from the JWT token
          console.log('Extracting role from token');
          let role;
          
          try {
            // JWT tokens are in format: header.payload.signature
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              // Decode the payload (middle part)
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Token payload:', payload);
              
              // Check for role in various possible locations in the token payload
              if (payload.role) {
                role = payload.role;
              } else if (payload.Role) {
                role = payload.Role;
              } else if (payload.claims && Array.isArray(payload.claims)) {
                // Look for role in claims array
                const roleClaim = payload.claims.find(claim => 
                  claim.type === 'role' || claim.type === 'Role' || claim.type === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
                );
                if (roleClaim && roleClaim.value) {
                  role = roleClaim.value;
                }
              } else if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
                // Standard JWT role claim
                role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
              }
              
              console.log('Role extracted from token:', role);
            }
          } catch (tokenError) {
            console.error('Failed to extract role from token:', tokenError);
          }
          
          // Only use ADVERTISER as absolute last resort if no role found
          if (!role) {
            console.warn('No role found in token, defaulting to ADVERTISER');
            role = 'ADVERTISER';
          }
          
          // Create a minimal user object with the extracted role
          console.log('Creating minimal user object with email:', data.email, 'and role:', role);
          const minimalUser: Advertiser = {
            id: null,
            sellerId: null,
            firstName: '',
            lastName: '',
            email: data.email,
            phoneNumber: '',
            address: '',
            shopName: '',
            role: role, // Use the extracted role or default
            status: 'ACTIVE',
          };
          
          return {
            token,
            user: minimalUser,
          };
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  getAdvertiserByEmail: async (email: string): Promise<Advertiser> => {
    try {
      const response = await advertiserAxios.get(`/email/${email}`);
      return normalizeAdvertiserData(response.data);
    } catch (error) {
      console.error(`Failed to fetch advertiser by email ${email}:`, error);
      throw error;
    }
  },

  getAdvertisersByAgency: async (agencyId: string): Promise<Advertiser[]> => {
    try {
      const response = await advertiserAxios.get(`/agency/${agencyId}`);

      if (Array.isArray(response.data)) {
        return response.data.map(normalizeAdvertiserData);
      }
      console.error("API returned unexpected data format:", response.data);
      return [];
    } catch (error) {
      console.error(
        `Failed to fetch advertisers for agency ${agencyId}:`,
        error
      );
      return [];
    }
  },
  
  /**
   * Assigns an advertiser to an agency
   * @param advertiserId - The ID of the advertiser to assign
   * @param agencyId - The ID of the agency to assign the advertiser to
   * @returns The updated advertiser data
   */
  assignAdvertiserToAgency: async (advertiserId: number, agencyId: number): Promise<Advertiser> => {
    try {
      // The endpoint returns 204 No Content on success
      await advertiserAxios.put(`/${advertiserId}/assign-to-agency/${agencyId}`);
      
      // Since the endpoint doesn't return the updated advertiser, we need to fetch it
      const updatedAdvertiser = await advertiserAxios.get(`/${advertiserId}`);
      return normalizeAdvertiserData(updatedAdvertiser.data);
    } catch (error) {
      console.error(`Failed to assign advertiser ${advertiserId} to agency ${agencyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Removes an advertiser from their current agency
   * @param advertiserId - The ID of the advertiser to remove from agency
   * @returns The updated advertiser data
   */
  removeAdvertiserFromAgency: async (advertiserId: number): Promise<Advertiser> => {
    try {
      // The endpoint returns 204 No Content on success
      await advertiserAxios.put(`/${advertiserId}/remove-from-agency`);
      
      // Since the endpoint doesn't return the updated advertiser, we need to fetch it
      const updatedAdvertiser = await advertiserAxios.get(`/${advertiserId}`);
      return normalizeAdvertiserData(updatedAdvertiser.data);
    } catch (error) {
      console.error(`Failed to remove advertiser ${advertiserId} from agency:`, error);
      throw error;
    }
  },
};

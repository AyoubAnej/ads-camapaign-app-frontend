
import { LoginResponse, User, UserRole } from '@/types/auth';
import { advertiserApi, Advertiser } from './advertiserApi';

// Helper function to safely convert string role to UserRole enum
const mapStringToUserRole = (role: string): UserRole => {
  const normalizedRole = role?.toUpperCase() || '';
  
  if (normalizedRole === 'ADMIN') return 'ADMIN';
  if (normalizedRole === 'ADVERTISER') return 'ADVERTISER';
  if (normalizedRole === 'AGENCY_MANAGER') return 'AGENCY_MANAGER';
  
  // Default fallback
  return 'ADVERTISER';
};

// Helper function to convert Advertiser to User type
const mapAdvertiserToUser = (advertiser: Advertiser): User => {
  // Extract agency ID from the advertiser if available
  const agencyId = typeof advertiser.agencyId === 'number' ? advertiser.agencyId : null;
  
  return {
    id: advertiser.id,
    advertiserId: advertiser.id, // Use same ID as advertiser
    sellerId: advertiser.sellerId || 0, // Ensure sellerId is always defined
    tenantId: agencyId || 0, // Use agencyId as tenantId for filtering ad data
    firstName: advertiser.firstName || '',
    lastName: advertiser.lastName || '',
    email: advertiser.email || '',
    role: mapStringToUserRole(advertiser.role),
    phoneNumber: advertiser.phoneNumber || '',
    address: advertiser.address || '',
    agencyId: agencyId,
    shopName: advertiser.shopName || '',
  };
};

// Replace mock auth API with real implementation using proper type conversion
export const authApi = {
  login: async (email: string, password: string): Promise<{ data: LoginResponse }> => {
    try {
      const response = await advertiserApi.login({ email, password });
      
      if (!response || !response.user) {
        throw new Error('Invalid response format from login API');
      }
      
      // Convert Advertiser to User type
      const userData: User = mapAdvertiserToUser(response.user);
      
      // Create a properly typed response
      const typedResponse: LoginResponse = {
        token: response.token,
        user: userData
      };
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        data: typedResponse
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
    }
  },
};

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, AuthState, LoginCredentials } from '@/types/auth';
import { advertiserApi } from '@/lib/advertiserApi';

// Helper function to decode JWT token
const decodeJWT = (token: string): any => {
  try {
    // JWT tokens are split into three parts: header.payload.signature
    const base64Url = token.split('.')[1]; // Get the payload part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Helper function to extract advertiser ID from token
const getAdvertiserIdFromToken = (token: string): number | null => {
  try {
    const decodedToken = decodeJWT(token);
    if (!decodedToken) return null;
    
    // Check for NameIdentifier claim which might contain the advertiser ID
    // The exact claim name might vary depending on your JWT configuration
    const nameIdentifier = decodedToken.nameid || decodedToken.sub || decodedToken.NameIdentifier;
    
    // Log for debugging
    console.log('JWT Token claims:', decodedToken);
    
    if (nameIdentifier) {
      // Try to parse as number if it's a string
      return typeof nameIdentifier === 'number' ? nameIdentifier : parseInt(nameIdentifier, 10);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting advertiser ID from token:', error);
    return null;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthorized: (roles: UserRole[]) => boolean;
}

// Export the AuthContext to be used in useAuth.ts
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (token && userJson) {
        try {
          let user = JSON.parse(userJson) as User;
          
          // Extract advertiser ID from token if user is ADVERTISER and advertiserId is null
          if (user.role === 'ADVERTISER' && (user.advertiserId === null || user.advertiserId === undefined)) {
            console.log('Attempting to extract advertiserId from token for ADVERTISER user');
            const tokenAdvertiserId = getAdvertiserIdFromToken(token);
            
            if (tokenAdvertiserId) {
              console.log(`Found advertiserId in token: ${tokenAdvertiserId}`);
              
              // Update the user object with the extracted advertiser ID
              user = {
                ...user,
                advertiserId: tokenAdvertiserId,
                // Also set tenantId if it's not already set
                tenantId: user.tenantId || tokenAdvertiserId
              };
              
              // Update the user in localStorage
              localStorage.setItem('user', JSON.stringify(user));
              console.log('Updated user object with advertiserId from token');
            }
          }
          
          setAuthState({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to parse user data', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // Use the real API for login
      const response = await advertiserApi.login({
        email: credentials.email,
        password: credentials.password
      });
      
      // Initialize user object
      let user: User;
      
      // For ADVERTISER role, try multiple approaches to get the correct advertiser ID
      if (response.user.role === 'ADVERTISER') {
        // First, try to extract advertiser ID from the token
        const tokenAdvertiserId = response.token ? getAdvertiserIdFromToken(response.token) : null;
        console.log('Extracted advertiser ID from token:', tokenAdvertiserId);
        
        try {
          // Also fetch the complete advertiser data by email as a backup
          let advertiserData = null;
          if (response.user.email) {
            advertiserData = await advertiserApi.getAdvertiserByEmail(response.user.email);
            console.log('Fetched advertiser data:', advertiserData);
          }
          
          // Determine the best advertiser ID to use (prioritize token, then API data, then user ID)
          const bestAdvertiserId = tokenAdvertiserId || 
                                  (advertiserData ? advertiserData.id : null) || 
                                  response.user.id;
          
          console.log(`Using advertiser ID: ${bestAdvertiserId} (from ${tokenAdvertiserId ? 'token' : 
                                                                   advertiserData ? 'API' : 'user ID'})`);
          
          // Map the data to User format with the best available advertiser ID
          user = {
            id: response.user.id,
            advertiserId: bestAdvertiserId,
            sellerId: response.user.sellerId,
            tenantId: bestAdvertiserId, // Use the same ID as tenant ID for authorization
            firstName: advertiserData?.firstName || response.user.firstName,
            lastName: advertiserData?.lastName || response.user.lastName,
            email: response.user.email,
            role: response.user.role as UserRole,
            phoneNumber: advertiserData?.phoneNumber || response.user.phoneNumber,
            address: advertiserData?.address || response.user.address,
            agencyId: advertiserData?.agencyId || response.user.agencyId,
            shopName: advertiserData?.shopName || response.user.shopName || '',
          };
        } catch (error) {
          console.error('Failed to fetch complete advertiser data:', error);
          // Fall back to using just the token ID or basic user data
          user = {
            id: response.user.id,
            advertiserId: tokenAdvertiserId || response.user.id,
            sellerId: response.user.sellerId,
            tenantId: tokenAdvertiserId || response.user.id, // Use token ID or user ID as tenant ID
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            email: response.user.email,
            role: response.user.role as UserRole,
            phoneNumber: response.user.phoneNumber,
            address: response.user.address,
            agencyId: response.user.agencyId,
            shopName: response.user.shopName || '',
          };
        }
      } else {
        // For other roles, use the response data directly
        user = {
          id: response.user.id,
          advertiserId: response.user.id,
          sellerId: response.user.sellerId,
          tenantId: response.user.id, // Use ID as tenant ID
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role as UserRole,
          phoneNumber: response.user.phoneNumber,
          address: response.user.address,
          agencyId: response.user.agencyId,
          shopName: response.user.shopName || '',
        };
      }
      
      // Store user in localStorage (token is already stored in advertiserApi.login)
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState({
        token: response.token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect based on user role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'ADVERTISER') {
        navigate('/advertiser/dashboard');
      } else if (user.role === 'AGENCY_MANAGER') {
        navigate('/agency/dashboard');
      } else {
        console.warn(`Unknown role: ${user.role}, defaulting to login page`);
        navigate('/login');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  };

  const isAuthorized = (roles: UserRole[]) => {
    return !!authState.user && roles.includes(authState.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAuthorized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Keep the useAuth hook in the same file to avoid redundancy
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

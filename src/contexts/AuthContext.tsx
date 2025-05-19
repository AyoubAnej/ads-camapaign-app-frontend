import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, AuthState, LoginCredentials } from '@/types/auth';
import { advertiserApi } from '@/lib/advertiserApi';

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
          const user = JSON.parse(userJson) as User;
          
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
      
      // Map the advertiser data to User format
      // Since the Advertiser interface doesn't have tenantId, we'll use a default value
      const user: User = {
        id: response.user.id,
        advertiserId: response.user.id, // Use the same ID for both
        sellerId: response.user.sellerId,
        tenantId: 0, // Default value for tenantId
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: response.user.role as UserRole,
        phoneNumber: response.user.phoneNumber,
        address: response.user.address,
        agencyId: response.user.agencyId,
        shopName: response.user.shopName || '', // Provide default value if not available
      };
      
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


import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Update import path
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

const ProtectedRoute = ({ roles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state if auth is still initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to unauthorized page if not authorized for the role
  if (roles.length > 0 && !isAuthorized(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected content
  return <Outlet />;
};

export default ProtectedRoute;

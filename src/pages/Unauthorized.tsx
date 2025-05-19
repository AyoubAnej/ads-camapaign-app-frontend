
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    // Redirect based on user role
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'ADVERTISER') {
      navigate('/advertiser/dashboard');
    } else if (user?.role === 'AGENCY_MANAGER') {
      navigate('/agency/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-red-600 mb-6">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" onClick={goBack}>
            Go Back
          </Button>
          <Button onClick={goHome}>
            Go to Dashboard
          </Button>
          <Button variant="destructive" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

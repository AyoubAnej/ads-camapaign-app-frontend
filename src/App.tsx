import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import ProfilePage from "@/pages/ProfilePage";
import { AdPage } from "@/pages/campaigns/AdPage";
import CreateAdPage from "@/pages/CreateAdPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCampaigns from "@/pages/admin/AdminCampaigns";
import AdminAgencies from "@/pages/admin/AdminAgencies";

// Advertiser Pages
import AdvertiserDashboard from "@/pages/advertiser/AdvertiserDashboard";
import AdvertiserCampaigns from "@/pages/advertiser/AdvertiserCampaigns";

// Agency Pages
import AgencyManagerDashboard from "@/pages/agency/AgencyManagerDashboard";
import AgencyCampaigns from "@/pages/agency/AgencyCampaigns";
import AgencyDetailsPage from "@/pages/agency/AgencyDetailsPage";

const App = () => {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <BrowserRouter>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Settings Page - Available to all authenticated users */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'ADVERTISER', 'AGENCY_MANAGER']} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      
                      {/* Campaign and Ad Routes - Available to all authenticated users */}
                      <Route path="/campaigns/:campaignId/ads" element={<AdPage />} />
                      <Route path="/campaigns/:campaignId/ads/:adId" element={<AdPage />} />
                      <Route path="/campaigns/:campaignId/create-ad" element={<CreateAdPage />} />
                    </Route>
                  </Route>
                  
                  {/* Protected Admin Routes */}
                  <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/agencies" element={<AdminAgencies />} />
                      <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                      <Route path="/admin/analytics" element={<div className="p-4">Analytics Page</div>} />
                      <Route path="/admin/settings" element={<Settings />} />
                      <Route path="/admin/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>
                  
                  {/* Protected Advertiser Routes */}
                  <Route element={<ProtectedRoute roles={['ADVERTISER']} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/advertiser/dashboard" element={<AdvertiserDashboard />} />
                      <Route path="/advertiser/campaigns" element={<AdvertiserCampaigns />} />
                      <Route path="/advertiser/analytics" element={<div className="p-4">Advertiser Analytics Page</div>} />
                      <Route path="/advertiser/settings" element={<Settings />} />
                      <Route path="/advertiser/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>
                  
                  {/* Protected Agency Manager Routes */}
                  <Route element={<ProtectedRoute roles={['AGENCY_MANAGER']} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/agency/dashboard" element={<AgencyManagerDashboard />} />
                      <Route path="/agency/campaigns" element={<AgencyCampaigns />} />
                      <Route path="/agency/details" element={<AgencyDetailsPage />} />
                      <Route path="/agency/analytics" element={<div className="p-4">Agency Analytics Page</div>} />
                      <Route path="/agency/settings" element={<Settings />} />
                      <Route path="/agency/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>
                  
                  {/* Redirect root to login */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

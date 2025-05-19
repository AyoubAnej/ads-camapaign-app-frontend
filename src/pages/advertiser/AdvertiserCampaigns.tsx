import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext"; 
import { advertiserApi } from "@/lib/advertiserApi";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";

const AdvertiserCampaigns = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch advertiser data
  const { data: advertiserData, isLoading, error } = useQuery({
    queryKey: ['advertiser', user?.id],
    queryFn: () => user?.id ? advertiserApi.getAdvertiserById(user.id.toString()) : Promise.reject('User ID not available'),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading campaigns...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading campaign data. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-gray-500">Manage your advertising campaigns</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>
      
      <Card className="p-6">
        <CampaignTable />
      </Card>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateCampaign={() => {
          // Refresh the campaign table when a new campaign is created
          window.location.reload();
        }}
      />
    </div>
  );
};

export default AdvertiserCampaigns;

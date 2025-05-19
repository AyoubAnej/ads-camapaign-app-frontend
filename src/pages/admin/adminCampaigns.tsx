import { useState } from "react";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";

const AdminCampaigns = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Campaigns</h1>
          <p className="text-gray-500">Manage all campaigns in the system</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Campaign
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

export default AdminCampaigns;

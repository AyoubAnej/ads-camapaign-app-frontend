import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignApi } from '@/lib/campaignApi';
import { 
  GetCampaignResponseDto, 
  GlobalState, 
  getGlobalStateString,
  getCampaignTypeString,
  PaginationResponseDto
} from '@/types/campaign';
import { CreateCampaignModal } from './CreateCampaignModal';
import { EditCampaignModal } from './EditCampaignModal';
import { DeleteCampaignModal } from './DeleteCampaignModal';
import { Eye, Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportButtons } from '@/components/ui/export-buttons';
import { TableColumn } from '@/lib/exportUtils';

interface CampaignTableProps {
  className?: string;
  showCreateButton?: boolean;
}

interface FilterOptions {
  status: string;
  search: string;
}

export const CampaignTable: React.FC<CampaignTableProps> = ({ 
  className,
  showCreateButton = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<GetCampaignResponseDto | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<GetCampaignResponseDto | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'All Statuses',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Define columns for export
  const exportColumns: TableColumn[] = [
    { header: 'Campaign ID', accessor: 'campaignId' },
    { header: 'Campaign Name', accessor: 'campaignName' },
    { header: 'Type', accessor: 'campaignType', format: (value) => getCampaignTypeString(value) },
    { header: 'Status', accessor: 'globalState', format: (value) => getGlobalStateString(value) },
    { header: 'Start Date', accessor: 'campaignStartDate', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { header: 'End Date', accessor: 'campaignEndDate', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { header: 'Creation Date', accessor: 'creationDate', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { header: 'Update Date', accessor: 'updateDate', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { 
      header: 'Bid Amount', 
      accessor: 'bid.amount', 
      format: (value) => value ? `$${parseFloat(value).toFixed(2)}` : '' 
    },
    { header: 'Tenant ID', accessor: 'tenantId' },
  ];

  const { toast } = useToast();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      try {
        // Try to get campaigns with pagination first
        const response = await campaignApi.getCampaigns();
        
        // Check the response type and extract campaigns array
        if (response && typeof response === 'object') {
          // If it's a pagination response
          if ('items' in response && Array.isArray((response as any).items)) {
            return (response as PaginationResponseDto<GetCampaignResponseDto>).items;
          }
        }
        
        // Fallback to getting all campaigns without pagination
        const allCampaigns = await campaignApi.getAllCampaigns();
        return Array.isArray(allCampaigns) ? allCampaigns : [allCampaigns].filter(Boolean);
      } catch (error: any) {
        // Check if error is due to authentication
        if (error?.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page or log in again.",
            variant: "destructive",
          });
        }
        console.error('Error fetching campaigns:', error);
        throw new Error('Failed to fetch campaigns');
      }
    },
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) return false;
      return failureCount < 3; // Retry other errors up to 3 times
    },
  });

  // Ensure we always have an array of campaigns
  const campaignsList = Array.isArray(data) ? data : [];
  
  // Filter and paginate campaigns
  const filteredCampaigns = React.useMemo(() => {
    if (!campaignsList) return [];
    
    return campaignsList.filter(campaign => {
      // Filter by search term
      const searchMatch = filters.search === '' || 
        (campaign.campaignName ? campaign.campaignName.toLowerCase().includes(filters.search.toLowerCase()) : false) ||
        (campaign.campaignId ? campaign.campaignId.toString().includes(filters.search) : false);
      
      // Filter by status
      const statusMatch = filters.status === 'All Statuses' || 
        (filters.status === 'Active' && campaign.globalState === GlobalState.OK) ||
        (filters.status === 'Inactive' && campaign.globalState !== GlobalState.OK);
      
      return searchMatch && statusMatch;
    });
  }, [campaignsList, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteCampaign = async (campaignId: number | string) => {
    try {
      await campaignApi.deleteCampaign(campaignId);
      closeDeleteModal();
      // Refresh the campaign list after successful deletion
      refetch();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      // Keep the modal open if there's an error
      // You might want to add toast notifications here for better user feedback
    }
  };

  const openDeleteModal = (campaign: GetCampaignResponseDto) => {
    setCampaignToDelete(campaign);
  };

  const closeDeleteModal = () => {
    setCampaignToDelete(null);
    refetch();
  };

  const openEditModal = (campaign: GetCampaignResponseDto) => {
    setCampaignToEdit(campaign);
  };

  const closeEditModal = () => {
    setCampaignToEdit(null);
    refetch();
  };

  const handleViewAds = (campaignId: number) => {
    navigate(`/campaigns/${campaignId}/ads`);
  };

  // Function to determine if user can edit/delete campaigns
  const canEditCampaigns = () => {
    return user?.role === 'ADMIN' || user?.role === 'ADVERTISER';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-background rounded-lg p-6">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 my-4">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-destructive">Error Loading Campaign Data</h3>
        </div>
        <p className="text-destructive/80 mb-3">{error instanceof Error ? error.message : 'Failed to load campaign data'}</p>
        <Button 
          onClick={() => refetch()} 
          variant="destructive"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className + " space-y-4"}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Management</h2>
        {canEditCampaigns() && showCreateButton && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Register Campaign
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">Manage your advertising campaigns</p>

      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or ID..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Statuses">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <ExportButtons 
              data={filteredCampaigns}
              columns={exportColumns}
              fileName="campaigns"
              title="Campaign Management"
            />
            
            {canEditCampaigns() && showCreateButton && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {paginatedCampaigns.length > 0 ? (
                paginatedCampaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <span className="font-medium">{campaign.campaignId ? campaign.campaignId.toString().charAt(0) : 'C'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{campaign.campaignId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{campaign.campaignName}</div>
                    </TableCell>
                    <TableCell>{getCampaignTypeString(campaign.campaignType)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={campaign.globalState === GlobalState.OK ? 
                          "bg-green-500 hover:bg-green-600 text-white border-none" : 
                          "bg-muted text-muted-foreground"}
                      >
                        {campaign.globalState === GlobalState.OK ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(campaign.campaignStartDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {campaign.campaignEndDate 
                        ? new Date(campaign.campaignEndDate).toLocaleDateString() 
                        : 'No end date'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewAds(campaign.campaignId)}
                          title="View Ads"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEditCampaigns() && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditModal(campaign)}
                              title="Edit Campaign"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                              onClick={() => openDeleteModal(campaign)}
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-muted-foreground pb-2">
                        No campaigns found
                      </p>
                      {canEditCampaigns() && showCreateButton && (
                        <Button 
                          onClick={() => setShowCreateModal(true)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          New Campaign
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedCampaigns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{currentPage}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateCampaign={() => refetch()}
      />

      {/* Delete Campaign Modal */}
      {campaignToDelete && (
        <DeleteCampaignModal
          campaign={campaignToDelete}
          open={!!campaignToDelete}
          onOpenChange={(open) => {
            if (!open) closeDeleteModal();
          }}
          onDeleteCampaign={() => handleDeleteCampaign(campaignToDelete.campaignId)}
        />
      )}

      {/* Edit Campaign Modal */}
      {campaignToEdit && (
        <EditCampaignModal
          campaign={campaignToEdit}
          open={!!campaignToEdit}
          onOpenChange={(open) => {
            if (!open) closeEditModal();
          }}
          onEditCampaign={() => refetch()}
        />
      )}
    </div>
  );
};

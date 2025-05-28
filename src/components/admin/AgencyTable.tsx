import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agencyApi } from "@/lib/agenciesApi";
import { Agency, AgencyStatus, agencyStatusToString } from "@/types/agency";
import { format } from "date-fns";
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationModal } from "./ConfirmationModal";
import AddAgencyModal from "./AddAgencyModal";
import EditAgencyModal from "./EditAgencyModal";
import DeleteAgencyModal from "./DeleteAgencyModal";

export const AgencyTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // States for pagination and search
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Ref for search input to maintain focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Maintain focus on search input when data is refreshed
  useEffect(() => {
    // If the search input has focus before the query runs, restore focus after
    const inputHasFocus = document.activeElement === searchInputRef.current;
    
    return () => {
      if (inputHasFocus && searchInputRef.current) {
        // Use setTimeout to ensure focus happens after render
        setTimeout(() => {
          searchInputRef.current?.focus();
          // Preserve cursor position
          const length = searchInputRef.current?.value.length || 0;
          searchInputRef.current?.setSelectionRange(length, length);
        }, 0);
      }
    };
  }, [debouncedSearchTerm, currentPage, pageSize]);
  
  // States for modal visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  
  // Check if user has admin role
  const isAdmin = user?.role === "ADMIN";
  
  // Fetch agencies data with pagination
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agencies", currentPage, pageSize, debouncedSearchTerm],
    queryFn: async () => {
      try {
        return await agencyApi.getAllAgencies({ page: currentPage, pageSize, searchTerm: debouncedSearchTerm });
      } catch (error: any) {
        // Check if error is due to authentication
        if (error?.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page or log in again.",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    enabled: !!user, // Only fetch if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes (adjust as needed)
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) return false;
      return failureCount < 3; // Retry other errors up to 3 times
    },
  });

  // Mutations
  const deactivateAgencyMutation = useMutation({
    mutationFn: (agencyId: number) => agencyApi.deactivateAgency(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast({
        title: "Agency Deactivated",
        description: "The agency has been deactivated successfully.",
      });
      setIsDeactivateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate agency. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reactivateAgencyMutation = useMutation({
    mutationFn: (agencyId: number) => agencyApi.reactivateAgency(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast({
        title: "Agency Reactivated",
        description: "The agency has been reactivated successfully.",
      });
      setIsReactivateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reactivate agency. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate pagination for client-side fallback
  const agencies = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentAgencies = agencies;

  // Handle edit button click
  const handleEditClick = (agency: Agency) => {
    setSelectedAgency(agency);
    setIsEditModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (agency: Agency) => {
    setSelectedAgency(agency);
    setIsDeleteModalOpen(true);
  };

  // Handle toggle activation
  const handleToggleActivation = (agency: Agency) => {
    setSelectedAgency(agency);
    if (agency.status === AgencyStatus.ACTIVE) {
      setIsDeactivateModalOpen(true);
    } else {
      setIsReactivateModalOpen(true);
    }
  };

  // Handle successful operations
  const handleSuccess = (message: string) => {
    toast({ title: "Success", description: message });
    queryClient.invalidateQueries({ queryKey: ["agencies"] });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: AgencyStatus) => {
    switch (status) {
      case AgencyStatus.ACTIVE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case AgencyStatus.INACTIVE:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-background rounded-lg p-6">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">Loading agencies...</p>
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
          <h3 className="text-lg font-medium text-destructive">Error Loading Agency Data</h3>
        </div>
        <p className="text-destructive/80 mb-3">Failed to load agency data</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["agencies"] })} 
          variant="destructive"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agency Management</h2>
          <p className="text-muted-foreground">Manage your agencies and their details</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Agency
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAgencies.length > 0 ? (
              currentAgencies.map((agency) => (
                <TableRow key={agency.agencyId}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>{agency.phoneNumber}</TableCell>
                  <TableCell>
                    {agency.website ? (
                      <a 
                        href={agency.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {agency.website}
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={agency.description}>
                    {agency.description || <span className="text-gray-400">N/A</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(agency.status)} variant="outline">
                      {agencyStatusToString(agency.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(agency.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(agency.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(agency)}
                          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActivation(agency)}
                          className={agency.status === AgencyStatus.ACTIVE 
                            ? "text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-white" 
                            : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(agency)}
                          className="text-red-500 border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-4 text-gray-500">
                  No agencies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} agencies
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-normal text-muted-foreground">Agencies per page</p>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center text-muted-foreground justify-center text-sm font-normal">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Agency Modal */}
      <AddAgencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(agency) => handleSuccess(`Agency "${agency.name}" was successfully added`)}
      />

      {/* Edit Agency Modal */}
      {selectedAgency && (
        <EditAgencyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          agency={selectedAgency}
          onSuccess={(agency) => handleSuccess(`Agency "${agency.name}" was successfully updated`)}
        />
      )}

      {/* Delete Agency Modal */}
      {selectedAgency && (
        <DeleteAgencyModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          agency={selectedAgency}
          onSuccess={(agency) => handleSuccess(`Agency "${agency.name}" was successfully deleted`)}
        />
      )}

      {/* Deactivate Agency Modal */}
      {selectedAgency && (
        <ConfirmationModal
          open={isDeactivateModalOpen}
          onOpenChange={setIsDeactivateModalOpen}
          onConfirm={() => deactivateAgencyMutation.mutate(selectedAgency.agencyId)}
          title="Deactivate Agency"
          description={`Are you sure you want to deactivate ${selectedAgency.name}?`}
          confirmText="Deactivate"
        />
      )}

      {/* Reactivate Agency Modal */}
      {selectedAgency && (
        <ConfirmationModal
          open={isReactivateModalOpen}
          onOpenChange={setIsReactivateModalOpen}
          onConfirm={() => reactivateAgencyMutation.mutate(selectedAgency.agencyId)}
          title="Reactivate Agency"
          description={`Are you sure you want to reactivate ${selectedAgency.name}?`}
          confirmText="Reactivate"
        />
      )}
    </div>
  );
};

export default AgencyTable;

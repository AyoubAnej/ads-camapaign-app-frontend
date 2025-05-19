import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAgencies } from "@/lib/agenciesApi";
import { Agency } from "@/types/agency";
import { format } from "date-fns";
import { Edit, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddAgencyModal from "../ui/AddAgencyModal";
import EditAgencyModal from "./EditAgencyModal";
import DeleteAgencyModal from "./DeleteAgencyModal";

export const AgencyTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for modal visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Fetch agencies data
  const { data: agencies, isLoading, error } = useQuery({
    queryKey: ["agencies"],
    queryFn: getAgencies,
  });

  // Calculate pagination
  const totalItems = agencies?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAgencies = agencies?.slice(startIndex, endIndex) || [];

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

  // Handle successful operations
  const handleSuccess = (message: string) => {
    toast({ title: "Success", description: message });
    queryClient.invalidateQueries({ queryKey: ["agencies"] });
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
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Agency
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAgencies.length > 0 ? (
              currentAgencies.map((agency) => (
                <TableRow key={agency.agencyId}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>{agency.phoneNumber}</TableCell>
                  <TableCell>
                    <a 
                      href={agency.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {agency.website}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={agency.description}>
                    {agency.description}
                  </TableCell>
                  <TableCell>
                    {format(new Date(agency.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(agency.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(agency)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(agency)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
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
    </div>
  );
};

export default AgencyTable;

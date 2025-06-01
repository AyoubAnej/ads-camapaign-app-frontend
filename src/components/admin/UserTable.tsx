import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { advertiserApi, Advertiser } from "@/lib/advertiserApi";
import { SellerRegistrationModal } from "./SellerRegistrationModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { UserFilters } from "./UserFilters";
import { UserTableRow } from "./UserTableRow";
import { ConfirmationModal } from "./ConfirmationModal";
import { ExportButtons } from "@/components/ui/export-buttons";
import { TableColumn } from "@/lib/exportUtils";

export const UserTable = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all_roles");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Define columns for export
  const exportColumns: TableColumn[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'First Name', accessor: 'firstName' },
    { header: 'Last Name', accessor: 'lastName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Status', accessor: 'status' },
    { header: 'Shop Name', accessor: 'shopName' },
    { header: 'Phone Number', accessor: 'phoneNumber' },
    { header: 'Address', accessor: 'address' },
  ];
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Advertiser | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["advertisers"],
    queryFn: advertiserApi.getAllAdvertisers,
    meta: {
      errorMessage: t('admin.userTableToasts.toast.loadError.description'),
    },
  });

  React.useEffect(() => {
    if (error) {
      toast({
        title: t('admin.userTableToasts.toast.loadError.title'),
        description: t('admin.userTableToasts.toast.loadError.description'),
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const users: Advertiser[] = Array.isArray(data) ? data : [];

  const editUserMutation = useMutation({
    mutationFn: (userData: Advertiser) =>
      advertiserApi.updateAdvertiser(userData.id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
      toast({
        title: t('admin.userTableToasts.toast.updateSuccess.title'),
        description: t('admin.userTableToasts.toast.updateSuccess.description'),
      });
      setIsEditUserOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('admin.userTableToasts.toast.updateError.title'),
        description: t('admin.userTableToasts.toast.updateError.description'),
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => advertiserApi.deleteAdvertiser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
      toast({
        title: t('admin.userTableToasts.toast.deleteSuccess.title'),
        description: t('admin.userTableToasts.toast.deleteSuccess.description'),
        variant: "destructive",
      });
      setIsDeleteUserOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('admin.userTableToasts.toast.deleteError.title'),
        description: t('admin.userTableToasts.toast.deleteError.description'),
        variant: "destructive",
      });
    },
  });

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedActionUser, setSelectedActionUser] = useState<Advertiser | null>(null);

  const deactivateUserMutation = useMutation({
    mutationFn: (userId: number) => advertiserApi.deactivateAdvertiser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
      toast({
        title: t('admin.userTableToasts.toast.deactivateSuccess.title'),
        description: t('admin.userTableToasts.toast.deactivateSuccess.description'),
        variant: "destructive",
      });
      setIsDeactivateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('admin.userTableToasts.toast.deactivateError.title'),
        description: t('admin.userTableToasts.toast.deactivateError.description'),
        variant: "destructive",
      });
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: (userId: number) => advertiserApi.reactivateAdvertiser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
      toast({
        title: t('admin.userTableToasts.toast.reactivateSuccess.title'),
        description: t('admin.userTableToasts.toast.reactivateSuccess.description'),
        variant: "default",
      });
      setIsReactivateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('admin.userTableToasts.toast.reactivateError.title'),
        description: t('admin.userTableToasts.toast.reactivateError.description'),
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: Advertiser) => {
    const searchTerm = searchQuery.toLowerCase().trim();
    const matchesSearch =
      searchTerm === "" ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm);

    const matchesRole =
      roleFilter === "all_roles" ||
      (user.role && user.role.toUpperCase() === roleFilter);

    const matchesStatus =
      statusFilter === "all_statuses" ||
      user.status?.toUpperCase() === statusFilter;

    console.log('User:', user.email, 'Status:', user.status, 'Filter:', statusFilter, 'Matches:', matchesStatus);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  console.log('Filtered users count:', filteredUsers.length, 'Status filter:', statusFilter);
  console.log('All users statuses:', users.map(u => ({ email: u.email, status: u.status })));
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleRegisterSeller = (userData: Partial<Advertiser>) => {
    return advertiserApi.registerAdvertiser(userData as any);
  };

  const handleEditUser = (updatedUser: Advertiser) => {
    editUserMutation.mutate(updatedUser);
  };

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  if (currentPage > totalPages && totalPages !== 0) setCurrentPage(1);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <UserFilters
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            onRoleFilterChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}
            onStatusFilterChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButtons 
            data={filteredUsers}
            columns={exportColumns}
            fileName="users"
            title={t('admin.userManagement.title')}
          />
          
          <Button
            onClick={() => setIsSellerModalOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t('admin.sellerRegistration.title')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.userManagement.fields.name')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.email')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.phoneNumber')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.role')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.shopName')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.address')}</TableHead>
              <TableHead>{t('admin.userManagement.fields.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-400 py-8"
                >
                  {t('admin.userManagement.noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              currentUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onEdit={(user) => {
                    setSelectedUser(user);
                    setIsEditUserOpen(true);
                  }}
                  onDelete={(user) => {
                    setSelectedUser(user);
                    setIsDeleteUserOpen(true);
                  }}
                  deactivateUserMutation={deactivateUserMutation}
                  reactivateUserMutation={reactivateUserMutation}
                  setSelectedActionUser={setSelectedActionUser}
                  setIsDeactivateModalOpen={setIsDeactivateModalOpen}
                  setIsReactivateModalOpen={setIsReactivateModalOpen}
                />
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-2">
          <div className="w-full sm:w-auto flex justify-start">
            <span className="text-sm text-muted-foreground">              
              {totalItems === 0
                ? t('interactions.pagination.noItems')
                : t('interactions.pagination.showing', {
                    start: indexOfFirstItem + (totalItems ? 1 : 0),
                    end: Math.min(indexOfLastItem, totalItems),
                    total: totalItems
                  })}
            </span>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 justify-end">
            <DataTablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="users"
            />
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] ml-0 sm:ml-2">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SellerRegistrationModal
        open={isSellerModalOpen}
        onOpenChange={setIsSellerModalOpen}
        onRegisterSeller={handleRegisterSeller}
      />

      {selectedUser && (
        <>
          <EditUserModal
            open={isEditUserOpen}
            onOpenChange={setIsEditUserOpen}
            user={selectedUser}
            onEditUser={handleEditUser}
          />
          <DeleteUserModal
            open={isDeleteUserOpen}
            onOpenChange={setIsDeleteUserOpen}
            user={selectedUser}
            onDeleteUser={handleDeleteUser}
          />
        </>
      )}

      {selectedActionUser && (
        <>
          <ConfirmationModal
            open={isDeactivateModalOpen}
            onOpenChange={setIsDeactivateModalOpen}
            onConfirm={() => deactivateUserMutation.mutate(selectedActionUser.id)}
            title={t('admin.userManagement.deactivateUser')}
            description={t('admin.userManagement.deactivateWarning', { 
              userName: `${selectedActionUser.firstName} ${selectedActionUser.lastName}` 
            })}
            confirmText={t('admin.userManagement.deactivateUser')}
          />
          <ConfirmationModal
            open={isReactivateModalOpen}
            onOpenChange={setIsReactivateModalOpen}
            onConfirm={() => reactivateUserMutation.mutate(selectedActionUser.id)}
            title={t('admin.userManagement.reactivateUser')}
            description={t('admin.userManagement.reactivateWarning', { 
              userName: `${selectedActionUser.firstName} ${selectedActionUser.lastName}` 
            })}
            confirmText={t('admin.userManagement.reactivateUser')}
          />
        </>
      )}
    </div>
  );
};

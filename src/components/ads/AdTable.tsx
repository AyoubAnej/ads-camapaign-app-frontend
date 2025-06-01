import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useAuth } from '@/contexts/AuthContext';
import { adApi } from '@/lib/adApi';
import { GetAdResponseDto, AdPaginationParams } from '@/types/ad';
import { Eye, Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight, Filter, User } from 'lucide-react';
// import { CreateAdModal } from './CreateAdModal';
import { EditAdModal } from './EditAdModal';
import { DeleteAdModal } from './DeleteAdModal';
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AdTableProps {
  campaignId: number;
}

export const AdTable: React.FC<AdTableProps> = ({ campaignId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for search, filter, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 25, 50];

  // State for modals
  const [selectedAd, setSelectedAd] = useState<GetAdResponseDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // Pagination params
  const paginationParams: AdPaginationParams = {
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    statusFilter
  };

  // Fetch paginated ads data
  const { 
    data: paginatedData, 
    isLoading, 
    isError, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['ads', campaignId, paginationParams],
    queryFn: async () => {
      const response = await adApi.getAdsWithPagination(campaignId, paginationParams);
      if (!response || !response.items) {
        throw new Error('Invalid response format from API');
      }
      return response;
    },
    enabled: !!campaignId,
    staleTime: 5000, // Keep data fresh for 5 seconds
  });

  // Delete ad mutation
  const deleteMutation = useMutation({
    mutationFn: (adId: number) => adApi.deleteAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', campaignId] });
      setIsDeleteModalOpen(false);
      toast({
        title: t('ads.notifications.deleted.title'),
        description: t('ads.notifications.deleted.description'),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error deleting ad:', error);
      toast({
        title: t('ads.notifications.error.title'),
        description: t('ads.notifications.error.description'),
        variant: "destructive",
      });
    },
  });

  // Handle delete ad
  const handleDeleteAd = () => {
    if (selectedAd) {
      deleteMutation.mutate(selectedAd.adId);
    }
  };

  // Handle refresh after create/edit
  const handleAdChange = () => {
    queryClient.invalidateQueries({ queryKey: ['ads', campaignId] });
    toast({
      title: t('ads.notifications.success.title'),
      description: t('ads.notifications.success.description'),
      variant: "default",
    });
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (paginatedData) {
      setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p>{t('ads.notifications.error.loading')}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ads', campaignId, paginationParams] })}
        >
          {t('ui.actions.retry')}
        </Button>
      </div>
    );
  }

  // Get ads from paginated data
  const ads = paginatedData?.items || [];
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 1;

  return (
    <div className="space-y-4 p-4 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder={t('ads.table.columns.status')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ui.filters.all')}</SelectItem>
                <SelectItem value="active">{t('ads.table.status.active')}</SelectItem>
                <SelectItem value="inactive">{t('ads.table.status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={() => navigate(`/campaigns/${campaignId}/create-ad`)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> {t('ads.createAd')}
        </Button>
      </div>

      {/* Loading overlay for subsequent fetches */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/40 flex justify-center items-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p>{t('ads.table.noAds')}</p>
          {searchTerm || statusFilter !== 'all' ? (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              {t('ui.actions.clearFilters')}
            </Button>
          ) : (
            <Button 
              className="mt-4"
              onClick={() => navigate(`/campaigns/${campaignId}/create-ad`)}
            >
              {t('ads.createFirstAd')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-gray-600">
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('ads.table.columns.title')}</TableHead>
                  <TableHead>{t('ads.table.columns.product')}</TableHead>
                  <TableHead>{t('ads.table.columns.status')}</TableHead>
                  <TableHead>{t('ads.table.columns.bidAmount')}</TableHead>
                  <TableHead>{t('ads.table.columns.created')}</TableHead>
                  <TableHead className="text-right">{t('ads.table.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad, index) => (
                  <TableRow 
                    key={`ad-${ad.adId}`}
                    className={cn(
                      "border-b border-gray-200 dark:border-gray-700",
                      index === ads.length - 1 ? "border-b-0" : "" // No border on last row
                    )}
                  >
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.productId}</TableCell>
                    <TableCell>
                      <Badge variant={ad.adState?.isActive ? "default" : "secondary"}>
                        {ad.adState?.isActive ? t('ads.table.status.active') : t('ads.table.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${ad.bid?.amount?.toFixed(2) ?? "0.00"} {ad.bid?.currency ?? 'USD'}
                    </TableCell>
                    <TableCell>{formatDate(ad.creationDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Navigate to ad details page
                            navigate(`/campaigns/${campaignId}/ads/${ad.adId}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAd(ad);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => {
                            setSelectedAd(ad);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination with page size selection */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} ads
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isFetching}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Create Ad Modal - replaced with page navigation */}

      {/* Edit Ad Modal */}
      {selectedAd && (
        <EditAdModal
          ad={selectedAd}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onEditAd={handleAdChange}
        />
      )}

      {/* Delete Ad Modal */}
      {selectedAd && (
        <DeleteAdModal
          ad={selectedAd}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onDeleteAd={handleDeleteAd}
        />
      )}
    </div>
  );
};

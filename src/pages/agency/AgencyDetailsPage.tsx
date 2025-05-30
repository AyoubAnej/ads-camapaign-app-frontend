import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, Globe, Calendar, CheckCircle, UserPlus, Users, Search, Trash2, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { agencyApi } from "@/lib/agenciesApi";
import { agencyStatusToString, Agency } from "@/types/agency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { advertiserApi, Advertiser } from "@/lib/advertiserApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { DialogDescription } from "@radix-ui/react-dialog";

const AgencyDetailsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isAddAdvertiserModalOpen, setIsAddAdvertiserModalOpen] = useState(false);
  const [isRemoveAdvertiserModalOpen, setIsRemoveAdvertiserModalOpen] = useState(false);
  const [advertiserToRemove, setAdvertiserToRemove] = useState<Advertiser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Advertiser[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch agency data using the getAllAgencies endpoint which is role-based
  // For agency managers, this will return only their agency
  const { data: agencyData, isLoading: agencyLoading, error: agencyError } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAllAgencies(),
    enabled: true,
  });
  
  // Fetch advertisers for this agency
  const { data: advertisersData, isLoading: advertisersLoading, error: advertisersError } = useQuery({
    queryKey: ['agency-advertisers', agency?.agencyId],
    queryFn: () => agency ? advertiserApi.getAdvertisersByAgency(agency.agencyId.toString()) : Promise.resolve([]),
    enabled: !!agency,
  });
  
  // Extract the agency data from the response
  useEffect(() => {
    if (agencyData && agencyData.items && agencyData.items.length > 0) {
      setAgency(agencyData.items[0]);
    }
  }, [agencyData]);
  
  // Handle search for advertisers
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, you would have an API endpoint to search advertisers
      // For now, we'll just fetch all advertisers and filter client-side
      const allAdvertisers = await advertiserApi.getAllAdvertisers();
      const filtered = allAdvertisers.filter(adv => 
        adv.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        `${adv.firstName} ${adv.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.shopName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Filter out advertisers that already belong to this agency
      const filteredResults = filtered.filter(adv => adv.agencyId !== agency?.agencyId);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching advertisers:', error);
      toast({
        title: 'Error',
        description: 'Failed to search advertisers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding advertiser to agency
  const handleAddAdvertiserToAgency = async () => {
    if (!selectedAdvertiser || !agency) return;
    
    setIsLoading(true);
    try {
      // Use the new assignAdvertiserToAgency endpoint
      await advertiserApi.assignAdvertiserToAgency(
        selectedAdvertiser.id,
        agency.agencyId
      );
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['agency-advertisers', agency.agencyId] });
      
      toast({
        title: 'Success',
        description: `${selectedAdvertiser.firstName} ${selectedAdvertiser.lastName} has been added to your agency.`,
      });
      
      // Reset and close modal
      setSelectedAdvertiser(null);
      setSearchTerm('');
      setSearchResults([]);
      setIsAddAdvertiserModalOpen(false);
    } catch (error) {
      console.error('Error adding advertiser to agency:', error);
      toast({
        title: 'Error',
        description: 'Failed to add advertiser to your agency. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open remove advertiser confirmation modal
  const openRemoveAdvertiserModal = (advertiser: Advertiser) => {
    setAdvertiserToRemove(advertiser);
    setIsRemoveAdvertiserModalOpen(true);
  };

  // Handle removing advertiser from agency
  const handleRemoveAdvertiserFromAgency = async () => {
    if (!advertiserToRemove || !agency) return;
    
    setIsLoading(true);
    try {
      // Use the new removeAdvertiserFromAgency endpoint
      await advertiserApi.removeAdvertiserFromAgency(advertiserToRemove.id);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['agency-advertisers', agency.agencyId] });
      
      toast({
        title: 'Success',
        description: `${advertiserToRemove.firstName} ${advertiserToRemove.lastName} has been removed from your agency.`,
      });
      
      // Close the modal
      setIsRemoveAdvertiserModalOpen(false);
      setAdvertiserToRemove(null);
    } catch (error) {
      console.error('Error removing advertiser from agency:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove advertiser from your agency. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (agencyLoading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>;
  }

  if (agencyError) {
    return <div className="text-red-500">{t('common.error')}</div>;
  }

  if (!agency) {
    return <div className="text-amber-500">{t('agencies.details.noAgency')}</div>;
  }

  // Format date for better display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('agencies.details.title')}</h1>
          <p className="text-gray-500">
            {t('agencies.details.subtitle')}
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('agencies.details.information')}
          </TabsTrigger>
          <TabsTrigger value="advertisers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('agencies.advertisers.title')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          {/* Agency Details Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardTitle className="text-2xl">{agency.name}</CardTitle>
              <div className="flex items-center space-x-2 text-blue-100">
                <CheckCircle className="h-4 w-4" />
                <span>{agencyStatusToString(agency.status)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Agency Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('agencies.details.contact')}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('agencies.details.fields.name')}</p>
                        <p className="font-medium">{agency.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('agencies.details.fields.phone')}</p>
                        <p className="font-medium">{agency.phoneNumber}</p>
                      </div>
                    </div>
                    
                    {agency.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">{t('agencies.details.fields.website')}</p>
                          <a 
                            href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {agency.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Agency Dates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('agencies.details.dates.title')}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('agencies.details.dates.created')}</p>
                        <p className="font-medium">{formatDate(agency.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">{t('agencies.details.dates.updated')}</p>
                        <p className="font-medium">{formatDate(agency.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Agency Description */}
              {agency.description && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">{t('agencies.details.fields.description')}</h3>
                  <p className="text-gray-700">{agency.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advertisers" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">{t('agencies.advertisers.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('agencies.advertisers.subtitle')}</p>
            </div>
            <Button 
              onClick={() => setIsAddAdvertiserModalOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {t('agencies.advertisers.add')}
            </Button>
          </div>
          
          {advertisersLoading ? (
            <div className="flex justify-center items-center h-32">{t('agencies.advertisers.loading')}</div>
          ) : advertisersError ? (
            <div className="text-red-500">{t('agencies.advertisers.error')}</div>
          ) : advertisersData && advertisersData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agencies.advertisers.table.name')}</TableHead>
                  <TableHead>{t('agencies.advertisers.table.email')}</TableHead>
                  <TableHead>{t('agencies.advertisers.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advertisersData.map((advertiser) => (
                  <TableRow key={advertiser.id}>
                    <TableCell>
                      {advertiser.firstName} {advertiser.lastName}
                    </TableCell>
                    <TableCell>{advertiser.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRemoveAdvertiserModal(advertiser)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">{t('agencies.advertisers.empty')}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Advertiser Modal */}
      <Dialog open={isAddAdvertiserModalOpen} onOpenChange={setIsAddAdvertiserModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('agencies.advertisers.add')}</DialogTitle>
            <DialogDescription>
              {t('agencies.advertisers.search.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="search-advertisers">{t('agencies.advertisers.search.title')}</Label>
                <Input
                  id="search-advertisers"
                  placeholder={t('agencies.advertisers.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !searchTerm.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? t('common.searching') : (
                  <>
                    <Search className="h-4 w-4" />
                    {t('common.search')}
                  </>
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>{t('agencies.advertisers.table.name')}</TableHead>
                      <TableHead>{t('agencies.advertisers.table.email')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((advertiser) => (
                      <TableRow 
                        key={advertiser.id} 
                        className={`cursor-pointer hover:bg-muted ${selectedAdvertiser?.id === advertiser.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedAdvertiser(advertiser)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            checked={selectedAdvertiser?.id === advertiser.id}
                            onChange={() => setSelectedAdvertiser(advertiser)}
                            title={t('agencies.advertisers.table.name') + ': ' + advertiser.firstName + ' ' + advertiser.lastName}
                          />
                        </TableCell>
                        <TableCell>{advertiser.firstName} {advertiser.lastName}</TableCell>
                        <TableCell>{advertiser.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchTerm && !isLoading ? (
              <p className="text-center text-gray-500">{t('agencies.advertisers.empty')}</p>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddAdvertiserModalOpen(false);
                setSearchTerm('');
                setSearchResults([]);
                setSelectedAdvertiser(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddAdvertiserToAgency}
              disabled={isLoading || !selectedAdvertiser}
            >
              {isLoading ? t('common.adding') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Advertiser Confirmation Modal */}
      <AlertDialog open={isRemoveAdvertiserModalOpen} onOpenChange={setIsRemoveAdvertiserModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('agencies.advertisers.remove.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {advertiserToRemove && (
                <>
                  {t('agencies.advertisers.remove.description', {
                    name: `${advertiserToRemove.firstName} ${advertiserToRemove.lastName}`
                  })}
                  <p className="mt-2">{t('agencies.advertisers.remove.warning')}</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAdvertiserToRemove(null);
              }}
            >
              {t('agencies.advertisers.remove.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleRemoveAdvertiserFromAgency}
              disabled={isLoading}
            >
              {isLoading ? t('common.removing') : t('agencies.advertisers.remove.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgencyDetailsPage;

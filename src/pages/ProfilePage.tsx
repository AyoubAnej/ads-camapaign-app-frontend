import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { advertiserApi } from '@/lib/advertiserApi';
import { Advertiser } from '@/lib/advertiserApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Building2, Store, Phone, Mail, MapPin, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch additional user data based on role
        if (user.role === 'ADVERTISER' && user.advertiserId) {
          const advertiserData = await advertiserApi.getAdvertiserById(user.advertiserId.toString());
          setProfileData(advertiserData);
        } else if (user.role === 'AGENCY_MANAGER' && user.agencyId) {
          // For agency managers, we'd fetch agency data
          // This would require an agencyApi endpoint
          // For now, we'll use the basic user data
          setProfileData({
            ...user,
            id: user.id,
            sellerId: user.sellerId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            shopName: '',
            role: user.role,
            status: 'ACTIVE',
            agencyId: user.agencyId
          });
        } else {
          // For admins or if specific data fetch fails, use the basic user data
          setProfileData({
            ...user,
            id: user.id,
            sellerId: user.sellerId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            shopName: '',
            role: user.role,
            status: 'ACTIVE'
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        // Fallback to basic user data
        if (user) {
          setProfileData({
            ...user,
            id: user.id,
            sellerId: user.sellerId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            shopName: '',
            role: user.role,
            status: 'ACTIVE'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>You need to be logged in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName && user.lastName 
                ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {loading ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  `${profileData?.firstName || ''} ${profileData?.lastName || ''}`
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Shield className="h-4 w-4" />
                {user.role}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Shared Information */}
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <Separator className="my-2" />
              <div className="grid gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  {loading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    <span>{profileData?.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Role:</span>
                  <span>{user.role}</span>
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            {user.role === 'ADVERTISER' && (
              <div>
                <h3 className="text-lg font-medium">Advertiser Details</h3>
                <Separator className="my-2" />
                <div className="grid gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Advertiser ID:</span>
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span>{user.advertiserId}</span>
                    )}
                  </div>
                  {profileData?.shopName && (
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Shop Name:</span>
                      {loading ? (
                        <Skeleton className="h-4 w-48" />
                      ) : (
                        <span>{profileData.shopName}</span>
                      )}
                    </div>
                  )}
                  {profileData?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Phone Number:</span>
                      {loading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <span>{profileData.phoneNumber}</span>
                      )}
                    </div>
                  )}
                  {profileData?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Address:</span>
                      {loading ? (
                        <Skeleton className="h-4 w-64" />
                      ) : (
                        <span>{profileData.address}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.role === 'AGENCY_MANAGER' && (
              <div>
                <h3 className="text-lg font-medium">Agency Details</h3>
                <Separator className="my-2" />
                <div className="grid gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Agency ID:</span>
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span>{user.agencyId}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Manager Name:</span>
                    {loading ? (
                      <Skeleton className="h-4 w-48" />
                    ) : (
                      <span>{`${profileData?.firstName || ''} ${profileData?.lastName || ''}`}</span>
                    )}
                  </div>
                  {profileData?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Contact Phone:</span>
                      {loading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <span>{profileData.phoneNumber}</span>
                      )}
                    </div>
                  )}
                  {profileData?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Contact Email:</span>
                      {loading ? (
                        <Skeleton className="h-4 w-48" />
                      ) : (
                        <span>{profileData.email}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.role === 'ADMIN' && (
              <div>
                <h3 className="text-lg font-medium">Admin Details</h3>
                <Separator className="my-2" />
                <div className="grid gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Name:</span>
                    {loading ? (
                      <Skeleton className="h-4 w-48" />
                    ) : (
                      <span>{`${profileData?.firstName || ''} ${profileData?.lastName || ''}`}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    {loading ? (
                      <Skeleton className="h-4 w-48" />
                    ) : (
                      <span>{profileData?.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Admin Role:</span>
                    <span>System Administrator</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import { useTranslation } from 'react-i18next';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUser: (user: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string; 
    role: UserRole; 
    phoneNumber: string;
    address: string;
    agencyId?: string | null;
    shopName: string;
  }) => void;
}

export const AddUserModal = ({ open, onOpenChange, onAddUser }: AddUserModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADVERTISER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({ 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      phoneNumber, 
      address, 
      agencyId, 
      shopName 
    });
    
    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('ADVERTISER');
    setPhoneNumber('');
    setAddress('');
    setAgencyId(null);
    setShopName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('admin.userManagement.addUser')}</DialogTitle>
          <DialogDescription>
            {t('admin.userManagement.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">{t('admin.userManagement.fields.firstName')}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">{t('admin.userManagement.fields.lastName')}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">{t('admin.userManagement.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">{t('admin.userManagement.fields.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">{t('admin.userManagement.fields.phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="123-456-7890"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">{t('admin.userManagement.fields.address')}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shopName" className="text-right">{t('admin.userManagement.fields.shopName')}</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Business Name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">{t('admin.userManagement.fields.role')}</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{t('admin.userManagement.roles.admin')}</SelectItem>
                  <SelectItem value="ADVERTISER">{t('admin.userManagement.roles.advertiser')}</SelectItem>
                  <SelectItem value="AGENCY_MANAGER">{t('admin.userManagement.roles.agencyManager')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'AGENCY_MANAGER' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agencyId" className="text-right">{t('admin.userManagement.fields.agencyId')}</Label>
                <Input
                  id="agencyId"
                  value={agencyId || ''}
                  onChange={(e) => setAgencyId(e.target.value || null)}
                  placeholder="Agency ID"
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('admin.userManagement.deleteAgency')}</Button>
            <Button type="submit">{t('admin.userManagement.addUser')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

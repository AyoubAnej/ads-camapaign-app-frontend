
import { Filter } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleOptions = [
  { label: 'All Roles', value: 'all_roles' },
  { label: 'Administrator', value: 'ADMIN' },
  { label: 'Advertiser', value: 'ADVERTISER' },
  { label: 'Agency Manager', value: 'AGENCY_MANAGER' }
];

const statusOptions = [
  { label: 'All Statuses', value: 'all_statuses' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

interface UserFiltersProps {
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const UserFilters = ({
  searchQuery,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
}: UserFiltersProps) => {
  // Safe default values
  const safeSearchQuery = searchQuery || '';
  const safeRoleFilter = roleFilter || 'all_roles';
  const safeStatusFilter = statusFilter || 'all_statuses';
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
      <SearchInput
        value={safeSearchQuery}
        onChange={value => onSearchChange(value)}
        placeholder="Search by name or email..."
      />
      <div className="flex gap-2">
        <Select value={safeRoleFilter} onValueChange={value => onRoleFilterChange(value)}>
          <SelectTrigger className="min-w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(opt => (
              <SelectItem value={opt.value} key={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={safeStatusFilter} onValueChange={value => onStatusFilterChange(value)}>
          <SelectTrigger className="min-w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem value={opt.value} key={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

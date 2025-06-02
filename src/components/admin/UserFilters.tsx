import { Filter } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const roleOptions = [
    { value: "all_roles", label: t("admin.userManagement.filters.allRoles") },
    { value: "ADMIN", label: t("roles.admin") },
    { value: "ADVERTISER", label: t("roles.advertiser") },
    { value: "AGENCY_MANAGER", label: t("roles.agency_manager") },
  ];

  const statusOptions = [
    { value: "all_statuses", label: t("admin.userManagement.filters.allStatuses") },
    { value: "ACTIVE", label: t("common.active") },
    { value: "INACTIVE", label: t("common.inactive") },
  ];

  const safeRoleFilter = roleFilter || "all_roles";
  const safeStatusFilter = statusFilter || "all_statuses";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
      <SearchInput
        value={searchQuery}
        onChange={(value) => onSearchChange(value)}
        placeholder={t("admin.userManagement.filters.searchPlaceholder")}
      />
      <div className="flex gap-2">
        <Select
          value={safeRoleFilter}
          onValueChange={(value) => onRoleFilterChange(value)}
        >
          <SelectTrigger className="min-w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("admin.userManagement.filters.role")} />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((opt) => (
              <SelectItem value={opt.value} key={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={safeStatusFilter}
          onValueChange={(value) => onStatusFilterChange(value)}
        >
          <SelectTrigger className="min-w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("admin.userManagement.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem value={opt.value} key={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

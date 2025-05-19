
// components/UserFormFields.tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/types/auth"

interface UserFormFieldsProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  role: UserRole;
  setRole: (val: UserRole) => void;
  showPassword?: boolean;
  password?: string;
  setPassword?: (val: string) => void;
}

export const UserFormFields = ({
  name,
  setName,
  email,
  setEmail,
  role,
  setRole,
  showPassword = false,
  password,
  setPassword,
}: UserFormFieldsProps) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="name" className="text-right">Full Name</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="John Doe"
        className="col-span-3"
        required
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="email" className="text-right">Email</Label>
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
    {showPassword && setPassword && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">Password</Label>
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
    )}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="role" className="text-right">Role</Label>
      <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="ADVERTISER">Advertiser</SelectItem>
          <SelectItem value="AGENCY_MANAGER">Agency Manager</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
)


import { UserTable } from "@/components/admin/UserTable";

const AdminUsers = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage users and access permissions</p>
        </div>
      </div>
      
      <UserTable />
    </div>
  );
};

export default AdminUsers;
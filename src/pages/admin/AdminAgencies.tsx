
import { AgencyTable } from "@/components/admin/AgencyTable";

const AdminAgencies = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage agencies and their information</p>
        </div>
      </div>
      
      <AgencyTable />
    </div>
  );
};

export default AdminAgencies;

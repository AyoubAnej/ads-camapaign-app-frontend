
import { AgencyTable } from "@/components/admin/AgencyTable";
import { t } from "i18next";

const AdminAgencies = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.agencyManagement.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('admin.agencyManagement.addAgency')}</p>
        </div>
      </div>
      
      <AgencyTable />
    </div>
  );
};

export default AdminAgencies;

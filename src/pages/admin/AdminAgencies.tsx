
import { AgencyTable } from "@/components/admin/AgencyTable";
import { useTranslation } from "react-i18next";

const AdminAgencies = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.agencyManagement.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('admin.agencyManagement.description')}</p>
        </div>
      </div>
      
      <AgencyTable />
    </div>
  );
};

export default AdminAgencies;

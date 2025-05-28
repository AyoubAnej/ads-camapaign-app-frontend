import { UserTable } from "@/components/admin/UserTable";
import { useTranslation } from 'react-i18next';

const AdminUsers = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.userManagement.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('admin.userManagement.description')}</p>
        </div>
      </div>
      
      <UserTable />
    </div>
  );
};

export default AdminUsers;
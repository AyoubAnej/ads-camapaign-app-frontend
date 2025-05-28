import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('error.notFound.title')}</h2>
        <p className="text-gray-600 mb-8">{t('error.notFound.message')}</p>
        <div className="flex justify-center">
          <Button onClick={() => navigate("/")}>
            {t('error.notFound.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

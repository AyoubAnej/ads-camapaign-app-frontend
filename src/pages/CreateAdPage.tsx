import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreateAdForm } from '../components/ads/CreateAdForm';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const CreateAdPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigate to the appropriate campaigns page based on user role
  const navigateToCampaigns = () => {
    const userRole = user?.role;
    
    if (userRole === 'ADMIN') {
      navigate('/admin/campaigns');
    } else if (userRole === 'ADVERTISER') {
      navigate('/advertiser/campaigns');
    } else if (userRole === 'AGENCY_MANAGER') {
      navigate('/agency/campaigns');
    } else {
      // Fallback to a common route if role is unknown
      navigate('/campaigns');
    }
  };

  const { t } = useTranslation();

  if (!campaignId) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {t('ads.adCreatePage.create_ad.missing_campaign.message')}
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/campaigns')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            {t('ads.adCreatePage.create_ad.missing_campaign.button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigateToCampaigns()}
          className="text-primary hover:underline flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('ads.adCreatePage.create_ad.back_to_campaign')}
        </button>
        <h1 className="text-2xl font-bold ml-4">{t('ads.adCreatePage.create_ad.title')}</h1>
      </div>
      
      <CreateAdForm campaignId={parseInt(campaignId)} />
    </div>
  );
};

export default CreateAdPage;

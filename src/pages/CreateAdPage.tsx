import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreateAdForm } from '../components/ads/CreateAdForm';

const CreateAdPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  if (!campaignId) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Campaign ID is missing. Please select a campaign first.
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/campaigns')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Go to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(`/campaigns/${campaignId}`)}
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
          Back to Campaign
        </button>
        <h1 className="text-2xl font-bold ml-4">Create New Ad</h1>
      </div>
      
      <CreateAdForm campaignId={parseInt(campaignId)} />
    </div>
  );
};

export default CreateAdPage;

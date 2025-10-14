import React from 'react';
import FeaturePage from './FeaturePage';
import FeatureRequestPage from './FeatureRequestPage';

const FeatureRequestsPageExample: React.FC = () => {
  const handleCreateRequest = () => {
    console.log('Create new feature request');
  };

  const handleViewAnalytics = () => {
    console.log('View feature analytics');
  };

  return (
    <FeaturePage
      title="Feature Requests"
      subtitle="Community-Driven Innovation"
      description="Your voice drives our innovation. Explore community ideas, vote on features that matter to you, and share your own vision to help us build the tools that will revolutionize your content creation workflow."
      icon="pi-lightbulb"
      badge={{
        text: "Beta",
        severity: "info"
      }}
      stats={[
        {
          label: "Active Requests",
          value: "127",
          icon: "pi-star",
          color: "#f59e0b"
        },
        {
          label: "Votes Cast",
          value: "2.4K",
          icon: "pi-thumbs-up",
          color: "#10b981"
        },
        {
          label: "Completed",
          value: "43",
          icon: "pi-check-circle",
          color: "#8b5cf6"
        },
        {
          label: "In Progress",
          value: "18",
          icon: "pi-clock",
          color: "#3b82f6"
        }
      ]}
      actions={[
        {
          label: "New Request",
          icon: "pi pi-plus",
          onClick: handleCreateRequest,
          variant: "primary"
        },
        {
          label: "Analytics",
          icon: "pi pi-chart-bar",
          onClick: handleViewAnalytics,
          variant: "secondary",
          outlined: true
        }
      ]}
      breadcrumbs={[
        {
          label: "Home",
          url: "/",
          icon: "pi-home"
        },
        {
          label: "Community",
          url: "/community"
        },
        {
          label: "Feature Requests"
        }
      ]}
      headerGradient="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
      animated={true}
    >
      {/* This is where your existing FeatureRequestPage component would go */}
      <FeatureRequestPage />
    </FeaturePage>
  );
};

export default FeatureRequestsPageExample;
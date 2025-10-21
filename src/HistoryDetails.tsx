import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Toast } from 'primereact/toast';
import FeaturePage from './components/FeaturePage';
import { useTheme } from './contexts/ThemeContext';
import './HistoryDetails.scss';

interface HistoryItem {
  id: string;
  originalContent: string;
  processedContent: string;
  description?: string;
  createdAt: string;
}

const HistoryDetails: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme, isDarkMode } = useTheme();
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedProcessed, setCopiedProcessed] = useState(false);
  
  // Get item from navigation state or fetch from API
  const item: HistoryItem | null = location.state?.item || null;

  const copyToClipboard = async (text: string, type: 'original' | 'processed') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 3000);
      } else {
        setCopiedProcessed(true);
        setTimeout(() => setCopiedProcessed(false), 3000);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = (text: string) => {
    return text.split(/\s+/).filter(Boolean).length;
  };

  if (!item) {
    return (
      <FeaturePage
        title="Content Not Found"
        subtitle="History Item Missing"
        description="The requested history item could not be found. It may have been deleted or the link is invalid."
        icon="pi pi-exclamation-triangle"
        className={`history-details-error ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
        badge={{
          text: "Error",
          severity: "danger"
        }}
        actions={[
          {
            label: "Back to History",
            icon: "pi pi-arrow-left",
            onClick: () => navigate('/history'),
            variant: "primary"
          }
        ]}
        breadcrumbs={[
          { label: 'Home', url: '/', icon: 'pi-home' },
          { label: 'History', url: '/history', icon: "pi-history" },
          { label: 'Not Found', icon: 'pi-exclamation-triangle' }
        ]}
      >
        <div className="error-container">
          <p>The history item you're looking for doesn't exist or has been removed.</p>
        </div>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      title={item.description || 'Content Details'}
      subtitle="Humanification History"
      description="Compare your original content with the AI-humanified version. Copy either version to use in your projects."
      icon="pi pi-file-edit"
      className={`history-details-page ${isDarkMode ? 'dark-mode' : 'light-mode'} theme-${currentTheme.family.toLowerCase().replace(/\s+/g, '-')}`}
      badge={{
        text: formatDate(item.createdAt),
        severity: "info"
      }}
      stats={[
        {
          label: "Original Words",
          value: getWordCount(item.originalContent).toString(),
          icon: "pi pi-file",
          color: "info"
        },
        {
          label: "Processed Words",
          value: getWordCount(item.processedContent).toString(),
          icon: "pi pi-check-circle",
          color: "success"
        },
        {
          label: "Processing",
          value: "Complete",
          icon: "pi pi-verified",
          color: "primary"
        }
      ]}
      actions={[
        {
          label: "Back to History",
          icon: "pi pi-arrow-left",
          onClick: () => navigate('/history'),
          outlined: true
        },
        {
          label: "New Content",
          icon: "pi pi-plus",
          onClick: () => navigate('/'),
          variant: "primary"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: 'pi-home' },
        { label: 'History', url: '/history', icon: 'pi-history' },
        { label: item.description || 'Content Details', icon: 'pi-file-edit' }
      ]}
    >
      <Toast position="top-right" />
      
      <div className="content-container">
        <Splitter style={{ height: '70vh' }}>
          <SplitterPanel className="content-panel">
            <div className="panel-header">
              <div className="header-left">
                <h3>Original Content</h3>
                <span className="word-count">{getWordCount(item.originalContent)} words</span>
              </div>
              <div className="header-right">
                <Button
                  icon={copiedOriginal ? "pi pi-check" : "pi pi-copy"}
                  label={copiedOriginal ? 'Copied!' : 'Copy'}
                  className={copiedOriginal ? 'p-button-success' : 'p-button-outlined'}
                  size="small"
                  onClick={() => copyToClipboard(item.originalContent, 'original')}
                />
              </div>
            </div>
            <div className="panel-content">
              <pre>{item.originalContent}</pre>
            </div>
          </SplitterPanel>
          
          <SplitterPanel className="content-panel processed-panel">
            <div className="panel-header">
              <div className="header-left">
                <h3>Humanified Content</h3>
                <span className="word-count">{getWordCount(item.processedContent)} words</span>
              </div>
              <div className="header-right">
                <Button
                  icon={copiedProcessed ? "pi pi-check" : "pi pi-copy"}
                  label={copiedProcessed ? 'Copied!' : 'Copy'}
                  className={copiedProcessed ? 'p-button-success' : 'p-button-outlined'}
                  size="small"
                  onClick={() => copyToClipboard(item.processedContent, 'processed')}
                />
              </div>
            </div>
            <div className="panel-content">
              <pre>{item.processedContent}</pre>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
    </FeaturePage>
  );
};

export default HistoryDetails;
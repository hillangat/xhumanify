import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Toast } from 'primereact/toast';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';
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
      <main className="history-details">
        <div className="error-container">
          <h2>History item not found</h2>
          <Button 
            label="Back to History" 
            icon={<IoIosArrowBack />}
            onClick={() => navigate('/history')}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="history-details">
      <Toast position="top-right" />
      
      <div className="details-header">
        <Button 
          icon={<IoIosArrowBack />}
          label="Back to History"
          className="p-button-text"
          onClick={() => navigate('/history')}
        />
        
        <div className="item-info">
          <h1>{item.description || 'Untitled Content'}</h1>
          <p className="date-info">Created on {formatDate(item.createdAt)}</p>
        </div>
      </div>

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
                  icon={copiedOriginal ? <FaCheck /> : <FaCopy />}
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
                  icon={copiedProcessed ? <FaCheck /> : <FaCopy />}
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
    </main>
  );
};

export default HistoryDetails;
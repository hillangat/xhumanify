import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { FaTrash } from 'react-icons/fa';
import { FcViewDetails } from "react-icons/fc";
import EmptyContent from './EmptyContent';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdHistory } from 'react-icons/md';
import './HistoryView.scss';

interface HistoryItem {
  id: string;
  originalContent: string;
  processedContent: string;
  description?: string;
  createdAt: string;
}

export default function HistoryView() {
  const client = generateClient<Schema>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data } = await client.models.UserContentHistory.list({
        limit: 50
      });
      setHistory((data || []) as HistoryItem[]);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (deletingItems.has(id)) return;
    
    setDeletingItems(prev => new Set([...prev, id]));
    
    try {
      await client.models.UserContentHistory.delete({ id });
      await loadHistory();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'History item deleted successfully',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to delete history item:', error);
      
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete history item. Please try again.',
        life: 5000
      });
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleViewDetails = (item: HistoryItem) => {
    navigate(`/history/${item.id}`, { state: { item } });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <main className="history-view">
      <ConfirmDialog />
      <Toast ref={toast} position="top-right" />
      
      <div className="history-header">
        <h1>Content History</h1>
        <p>Your previous humanifications</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <ProgressSpinner style={{ width: '45px', height: '45px' }} />
          <p>Loading your history...</p>
        </div>
      ) : history.length === 0 ? (
        <EmptyContent
          icon={<MdHistory size={35} />}
          title="No History Found"
          subtitle="Start humanifying content to see your history here."
        />
      ) : (
        <div className="history-grid">
          {history.map((item) => (
            <Card key={item.id} className="history-card">
              <div className="card-header">
                <div className="date-info">
                  <span className="date">{formatDate(item.createdAt)}</span>
                </div>
                <div className="card-actions">
                  <Button
                    icon={<FcViewDetails />}
                    className="p-button-text p-button-sm"
                    onClick={() => handleViewDetails(item)}
                    tooltip="View details"
                    tooltipOptions={{ position: 'bottom' }}
                  />
                  {deletingItems.has(item.id) ? (
                    <ProgressSpinner style={{ width: '1.5rem', height: '1.5rem' }} />
                  ) : (
                    <Button
                      icon={<FaTrash />}
                      className="p-button-text p-button-sm p-button-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDialog({
                          message: `Are you sure you want to delete this history item?`,
                          header: 'Delete Confirmation',
                          icon: 'pi pi-exclamation-triangle',
                          defaultFocus: 'reject',
                          acceptClassName: 'p-button-danger',
                          acceptLabel: 'Delete',
                          rejectLabel: 'Cancel',
                          accept: () => deleteHistoryItem(item.id)
                        });
                      }}
                      tooltip="Delete item"
                      tooltipOptions={{ position: 'bottom' }}
                    />
                  )}
                </div>
              </div>

              <div className="card-content">
                {item.description && (
                  <h3 className="description">{item.description}</h3>
                )}
                <p className="preview-text">
                  {getPreviewText(item.originalContent)}
                </p>
                <div className="content-stats">
                  <span className="word-count">
                    {item.originalContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span className="separator">•</span>
                  <span className="content-type">Humanified</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
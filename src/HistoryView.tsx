import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import EmptyContent from './EmptyContent';
import FeaturePage from './components/FeaturePage';
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const loadHistory = async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const { data } = await client.models.UserContentHistory.list({
        limit: 50
      });
      
      // Sort by createdAt date in descending order (most recent first)
      const sortedHistory = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setHistory(sortedHistory as HistoryItem[]);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (deletingItems.has(id)) return;
    
    setDeletingItems(prev => new Set([...prev, id]));
    
    try {
      await client.models.UserContentHistory.delete({ id });
      await loadHistory(false); // Don't show full page loading
      
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

  const handleRefreshHistory = () => {
    loadHistory(false); // Use refresh loading, not initial loading
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  useEffect(() => {
    loadHistory(true); // This is initial loading
  }, []);

  // Calculate stats for the header
  const totalItems = history.length;
  const totalWords = history.reduce((sum, item) => 
    sum + item.originalContent.split(/\s+/).filter(Boolean).length, 0
  );
  const recentItems = history.filter(item => {
    const itemDate = new Date(item.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return itemDate > weekAgo;
  }).length;

  return (
    <FeaturePage
      title="Content History"
      subtitle="Your AI Humanification Journey"
      description="Track and revisit all your previous content transformations. Each entry represents a step in your journey to create more authentic, human-like content that resonates with your audience."
      icon="pi pi-history"
      badge={totalItems > 0 ? {
        text: `${totalItems} Items`,
        severity: "info"
      } : undefined}
      stats={totalItems > 0 ? [
        {
          label: "Total Items",
          value: totalItems.toString(),
          icon: "pi-file",
          color: "#3b82f6"
        },
        {
          label: "Words Processed",
          value: totalWords.toLocaleString(),
          icon: "pi-book",
          color: "#10b981"
        },
        {
          label: "This Week",
          value: recentItems.toString(),
          icon: "pi-calendar",
          color: "#f59e0b"
        },
        {
          label: "Success Rate",
          value: "100%",
          icon: "pi-check-circle",
          color: "#8b5cf6"
        }
      ] : undefined}
      actions={[
        {
          label: "New Content",
          icon: "pi pi-plus",
          onClick: handleGoToHome,
          variant: "primary"
        },
        {
          label: "Refresh",
          icon: "pi pi-refresh",
          onClick: handleRefreshHistory,
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
          label: "History",
          icon: "pi-history"
        }
      ]}
      headerGradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)"
      animated={true}
      loading={isInitialLoading}
    >
      <main className="history-view-content">
        <ConfirmDialog />
        <Toast ref={toast} position="top-right" className="app-toast" />

        {!isInitialLoading && history.length === 0 ? (
          <EmptyContent
            icon={<MdHistory size={35} />}
            title="No History Found"
            subtitle="Start humanizing content to see your history here."
          />
        ) : !isInitialLoading && (
          <>
            {isRefreshing && (
              <div className="refresh-indicator">
                <i className="pi pi-spin pi-spinner" style={{ marginRight: '0.5rem' }} />
                Refreshing history...
              </div>
            )}
            <div className="history-grid">
              {history.map((item) => (
              <Card 
                key={item.id} 
                className="history-card"
                onClick={() => handleViewDetails(item)}
              >
                <div className="card-header">
                  <div className="date-info">
                    <span className="date">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="card-actions">
                    <Button
                      label="View"
                      outlined
                      icon="pi pi-eye"
                      className="p-button-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(item);
                      }}
                      tooltip="View details"
                      tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                      label={deletingItems.has(item.id) ? "Deleting..." : "Delete"}
                      outlined
                      icon={deletingItems.has(item.id) ? "pi pi-spin pi-spinner" : "pi pi-trash"}
                      className="p-button-sm p-button-danger"
                      disabled={deletingItems.has(item.id)}
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
                      tooltip={deletingItems.has(item.id) ? "Deletion in progress..." : "Delete item"}
                      tooltipOptions={{ position: 'bottom' }}
                    />
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
          </>
        )}
      </main>
    </FeaturePage>
  );
}
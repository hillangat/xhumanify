import { useState, useEffect, useRef } from 'react';
import { generateClient as generateDataClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Messages } from 'primereact/messages';
import { FaTrash, FaCopy, FaCheck } from 'react-icons/fa';
import EmptyContent from './EmptyContent';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdHistory } from 'react-icons/md';
import Header from './Header';

const client = generateDataClient<Schema>();

interface HistoryItem {
  id: string;
  originalContent: string;
  processedContent: string;
  description?: string;
  createdAt: string;
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedItems, setCopiedItems] = useState<{[key: string]: 'original' | 'processed' | null}>({});
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const msgs = useRef<Messages>(null);

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
    if (deletingItems.has(id)) return; // Prevent multiple deletions
    
    setDeletingItems(prev => new Set([...prev, id]));
    
    try {
      await client.models.UserContentHistory.delete({ id });
      await loadHistory(); // Refresh the list
      
      // Show success message
      if (msgs.current) {
        msgs.current.show([
          { 
            severity: 'success', 
            summary: 'Success', 
            detail: 'History item deleted successfully',
            life: 3000
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to delete history item:', error);
      
      // Show error message
      if (msgs.current) {
        msgs.current.show([
          { 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to delete history item. Please try again.',
            life: 5000
          }
        ]);
      }
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const copyToClipboard = async (text: string, itemId: string, type: 'original' | 'processed') => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Set the copied state for this specific item and type
      setCopiedItems(prev => ({ ...prev, [`${itemId}-${type}`]: type }));
      
      // Reset after 5 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [`${itemId}-${type}`]: null }));
      }, 5000);
      
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const customHeaderTemplate = (item: HistoryItem, options: any) => {
    return (
      <div className="custom-panel-header">
        <div className="header-left">
          <span className="history-date">
            {new Date(item.createdAt).toLocaleString()}{item.description ? `: ${item.description}` : ''}
          </span>
        </div>
        <div className="header-right">
          <Button
            icon={options.collapsed ? 'pi pi-plus' : 'pi pi-minus'}
            className="p-panel-header-icon p-link"
            onClick={options.onTogglerClick}
            tooltip={options.collapsed ? 'Expand' : 'Collapse'}
            tooltipOptions={{ position: 'bottom' }}
            text
          />
          {deletingItems.has(item.id) ? (
            <ProgressSpinner style={{ width: '1.5rem', height: '1.5rem' }} />
          ) : (
            <Button
              icon={<FaTrash />}
              severity="danger"
              text
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                confirmDialog({
                  message: `Are you sure you want to delete history item created on ${new Date(item.createdAt).toLocaleString()}${item.description ? ` (${item.description})` : ''}?`,
                  header: 'Delete Confirmation',
                  icon: 'pi pi-exclamation-triangle',
                  defaultFocus: 'reject',
                  acceptClassName: 'p-button-danger',
                  acceptLabel: 'Delete',
                  rejectLabel: 'Cancel',
                  accept: () => deleteHistoryItem(item.id)
                });
              }}
              tooltip="Delete this history item"
              tooltipOptions={{ position: 'bottom' }}
            />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <main>
      <ConfirmDialog />
      <Header />
      <div className="card messages-container">
        <Messages ref={msgs} />
      </div>
      <div className="history-container">
        {history.length > 0 && (
          <>
            <h2>Content History</h2>
            <p>Your previous humanifications</p>
          </>
        )}

      {history.length === 0 ? (
        <div style={{ marginTop: '3rem' }}>
          <EmptyContent
            icon={isLoading ? <ProgressSpinner style={{ width: '45px', height: '45px' }} /> : <MdHistory size={35} />}
            title={isLoading ? 'Loading History...' : 'No History Found'}
            subtitle={isLoading ? 'Please wait while we load your content history.' : 'Start humanifying content to see your history here.'}
          />
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <Panel 
              key={item.id} 
              headerTemplate={(options) => customHeaderTemplate(item, options)}
              toggleable
              collapsed
              className="history-panel mb-3"
            >
              <Splitter style={{ height: '600px' }} className='p-splitter-panel'>
                <SplitterPanel className="splitter-content-panel">
                  <div className="content-action-bar">
                    <div className="action-bar-left">
                      <h4 style={{ color: 'var(--primary-color)' }}>Original Content</h4>
                    </div>
                    <div className="action-bar-right">
                      <Button
                        icon={copiedItems[`${item.id}-original`] ? <FaCheck /> : <FaCopy />}
                        text
                        size="small"
                        onClick={() => copyToClipboard(item.originalContent, item.id, 'original')}
                        tooltip={copiedItems[`${item.id}-original`] ? "Copied!" : "Copy original content"}
                      />
                    </div>
                  </div>
                  <div className="content-text">
                    {item.originalContent}
                  </div>
                </SplitterPanel>
                <SplitterPanel className="splitter-content-panel processed-content-panel">
                  <div className="content-action-bar">
                    <div className="action-bar-left">
                      <h4 style={{ color: 'var(--primary-color)' }}>Processed Content</h4>
                    </div>
                    <div className="action-bar-right">
                      <Button
                        icon={copiedItems[`${item.id}-processed`] ? <FaCheck /> : <FaCopy />}
                        text
                        size="small"
                        onClick={() => copyToClipboard(item.processedContent, item.id, 'processed')}
                        tooltip={copiedItems[`${item.id}-processed`] ? "Copied!" : "Copy processed content"}
                      />
                    </div>
                  </div>
                  <div className="content-text">
                    {item.processedContent}
                  </div>
                </SplitterPanel>
              </Splitter>
            </Panel>
          ))}
        </div>
      )}
      </div>
    </main>
  );
}
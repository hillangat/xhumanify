import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Menubar } from 'primereact/menubar';
import { FaTrash, FaCopy, FaUser } from 'react-icons/fa';
import EmptyContent from './EmptyContent';
import { MdHistory } from 'react-icons/md';

const client = generateClient<Schema>();

interface HistoryItem {
  id: string;
  originalContent: string;
  processedContent: string;
  createdAt: string;
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const menuItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      url: '/'
    },
    {
      label: 'History',
      icon: 'pi pi-history',
      url: '/history'
    },
    {
      label: 'Features',
      icon: 'pi pi-star'
    },
    {
      label: 'About',
      icon: 'pi pi-info-circle'
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope'
    }
  ];

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
    try {
      await client.models.UserContentHistory.delete({ id });
      await loadHistory(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  return (
    <>
      <div className="card">
        <Menubar 
          model={menuItems} 
          start={<div className="p-menubar-start"><strong>XHumanify</strong></div>}
          end={<div className="p-menubar-end"><FaUser style={{ fontSize: '1.2rem' }} /></div>}
        />
      </div>
      <div className="history-container">
        <h2>Content History</h2>
        <p>Your previous humanifications</p>
      
      {history.length === 0 ? (
        <EmptyContent
          icon={<MdHistory size={35} />}
          title="No History Found"
          subtitle="Start humanifying content to see your history here."
        />
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <Card key={item.id} className="history-item">
              <div className="history-content">
                <div className="content-section">
                  <h4>Original:</h4>
                  <p className="content-text">{item.originalContent}</p>
                  <Button
                    icon={<FaCopy />}
                    outlined
                    size="small"
                    onClick={() => copyToClipboard(item.originalContent)}
                    tooltip="Copy original content"
                  />
                </div>
                
                <div className="content-section">
                  <h4>Humanified:</h4>
                  <p className="content-text">{item.processedContent}</p>
                  <Button
                    icon={<FaCopy />}
                    outlined
                    size="small"
                    onClick={() => copyToClipboard(item.processedContent)}
                    tooltip="Copy humanified content"
                  />
                </div>
                
                <div className="history-actions">
                  <small>Created: {new Date(item.createdAt).toLocaleDateString()}</small>
                  <Button
                    icon={<FaTrash />}
                    severity="danger"
                    outlined
                    size="small"
                    onClick={() => deleteHistoryItem(item.id)}
                    tooltip="Delete this history item"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
import React, { useRef } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { useSubscription } from '../contexts/SubscriptionContext';
import './UsageDisplay.scss';

interface UsageDisplayProps {
  compact?: boolean; // For header display vs full card display
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({ compact = false }) => {
  const { usageCount, usageLimit, currentPlan, currentTier } = useSubscription();
  const overlayRef = useRef<OverlayPanel>(null);

  const usagePercentage = usageLimit > 0 ? (usageCount / usageLimit) * 100 : 0;
  const wordsRemaining = Math.max(0, usageLimit - usageCount);
  
  const getSeverity = () => {
    if (usagePercentage >= 90) return 'danger';
    if (usagePercentage >= 75) return 'warning';
    return 'success';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  const displayPlan = currentPlan || (currentTier === 'free' ? 'Free' : 'Unknown');

  const toggleDetails = (event: React.MouseEvent) => {
    overlayRef.current?.toggle(event);
  };

  // Detailed usage panel content
  const renderDetailedUsage = () => (
    <div className="usage-details-panel" style={{ padding: '1rem', minWidth: '300px' }}>
      <div className="usage-header">
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Usage Statistics</h4>
        <span className="usage-numbers" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          {formatNumber(usageCount)} / {formatNumber(usageLimit)} words
        </span>
      </div>
      
      <ProgressBar 
        value={usagePercentage} 
        className={`usage-progress ${getSeverity()}`}
        showValue={true}
        style={{ marginBottom: '1rem' }}
      />
      
      <div className="usage-stats">
        <div className="usage-stat" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="label">Remaining:</span>
          <span className="value" style={{ fontWeight: 'bold' }}>{formatNumber(wordsRemaining)} words</span>
        </div>
        
        <div className="usage-stat" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="label">Current Plan:</span>
          <span className="value" style={{ fontWeight: 'bold' }}>{displayPlan}</span>
        </div>

        {usagePercentage >= 80 && (
          <div className="usage-warning" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.5rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <i className="pi pi-exclamation-triangle" style={{ color: '#856404' }}></i>
            <span>Consider upgrading your plan to avoid service interruption</span>
          </div>
        )}
      </div>
    </div>
  );

  if (compact) {
    // Compact display with clickable badge that opens overlay
    return (
      <>
        <Button
          className="usage-display-compact"
          style={{ 
            padding: '0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={toggleDetails}
          unstyled
          title="Click for usage details"
        >
          <Badge 
            value={
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="pi pi-external-link" style={{ fontSize: '0.8rem' }} />
                {`${formatNumber(wordsRemaining)} words left`}
              </span>
            }
            severity={getSeverity()}
            className="usage-badge"
            style={{ cursor: 'pointer' }}
          />
        </Button>
        
        <OverlayPanel
          ref={overlayRef}
          showCloseIcon
          className="usage-overlay"
          style={{ maxWidth: '400px' }}
        >
          {renderDetailedUsage()}
        </OverlayPanel>
      </>
    );
  }

  // Full card display
  return (
    <Card title="Usage Statistics" className="usage-display-card">
      {renderDetailedUsage()}
    </Card>
  );
};

export default UsageDisplay;
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { useSubscription } from '../contexts/SubscriptionContext';
import { countWords } from '../config/plans';
import './UsageDisplay.scss';

interface UsageDisplayProps {
  compact?: boolean; // For header display vs full card display
  currentPrompt?: string; // For checking current input against limits
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({ compact = false, currentPrompt = '' }) => {
  const { usageCount, usageLimit, currentPlan, currentTier, canUseService, checkUsageLimit, loading } = useSubscription();
  const overlayRef = useRef<OverlayPanel>(null);
  const navigate = useNavigate();

  const usagePercentage = usageLimit > 0 ? Math.round((usageCount / usageLimit) * 100 * 10) / 10 : 0;
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

  const handleUpgradeClick = () => {
    overlayRef.current?.hide();
    navigate('/upgrade');
  };

  // Detailed usage panel content
  const renderDetailedUsage = () => {
    if (loading) {
      return (
        <div className="usage-details-panel" style={{ padding: '2rem', minWidth: '300px', textAlign: 'center' }}>
          <ProgressSpinner 
            style={{ width: '50px', height: '50px' }} 
            strokeWidth="4" 
            animationDuration="1s"
          />
          <p style={{ marginTop: '1rem', color: 'var(--text-color-secondary)' }}>Loading usage data...</p>
        </div>
      );
    }
    
    return (
    <div className="usage-details-panel" style={{ padding: '1rem', minWidth: '300px' }}>
      <div className="usage-header">
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Usage Statistics</h4>
        <div className="usage-numbers" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          <strong>{formatNumber(usageCount)} used</strong>
          <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem', fontWeight: 'normal' }}>
            of {formatNumber(usageLimit)} words
          </span>
        </div>
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

        {/* Usage Limit Warnings */}
        {!canUseService && (
          <div className="usage-warning" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.5rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#721c24'
          }}>
            <i className="pi pi-times-circle" style={{ color: '#dc3545' }}></i>
            <span>Usage limit reached</span>
          </div>
        )}
        
        {currentPrompt && !checkUsageLimit(currentPrompt) && (
          <div className="usage-warning" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.5rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#856404'
          }}>
            <i className="pi pi-exclamation-triangle" style={{ color: '#ff6b35' }}></i>
            <span>Request too large for your plan ({countWords(currentPrompt)} words)</span>
          </div>
        )}
        
        {usagePercentage >= 80 && canUseService && (
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
      
      {/* Upgrade Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--surface-border)'
      }}>
        <Button 
          label="Upgrade"
          icon="pi pi-arrow-up"
          onClick={handleUpgradeClick}
          className="p-button-primary"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        />
      </div>
    </div>
    );
  };

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
              loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ProgressSpinner style={{ width: '12px', height: '12px' }} strokeWidth="4" />
                  Loading...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="pi pi-external-link" style={{ fontSize: '0.8rem' }} />
                  {`${formatNumber(wordsRemaining)} words left`}
                </span>
              )
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
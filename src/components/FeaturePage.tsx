import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import './FeaturePage.scss';

interface FeaturePageProps {
  /** The main title/name of the feature */
  title: string;
  /** Detailed description of what this feature does */
  description: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Icon class name (PrimeIcons) for the feature */
  icon?: string;
  /** Badge text to show feature status or highlight */
  badge?: {
    text: string;
    severity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  };
  /** Optional statistics to display */
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
  }>;
  /** Action buttons for the header */
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
    outlined?: boolean;
  }>;
  /** The main content/functionality component */
  children: React.ReactNode;
  /** Optional breadcrumb items */
  breadcrumbs?: Array<{
    label: string;
    url?: string;
    icon?: string;
  }>;
  /** Loading state */
  loading?: boolean;
  /** Custom header background gradient */
  headerGradient?: string;
  /** Enable/disable animations */
  animated?: boolean;
  /** Custom CSS class */
  className?: string;
}

const FeaturePage: React.FC<FeaturePageProps> = ({
  title,
  description,
  subtitle,
  icon,
  badge,
  stats,
  actions,
  children,
  breadcrumbs,
  loading = false,
  headerGradient,
  animated = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      // Trigger entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated]);

  const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const gradientStyle = {
    background: headerGradient || defaultGradient
  };

  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <div className="feature-page-breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="breadcrumb-item">
            {crumb.icon && <i className={`pi ${crumb.icon}`} />}
            {crumb.url ? (
              <a href={crumb.url} className="breadcrumb-link">
                {crumb.label}
              </a>
            ) : (
              <span className="breadcrumb-text">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <i className="pi pi-chevron-right breadcrumb-separator" />
            )}
          </span>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!stats || stats.length === 0) return null;

    return (
      <div className="feature-page-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item" style={{ '--stat-color': stat.color } as React.CSSProperties}>
            {stat.icon && (
              <div className="stat-icon">
                <i className={`pi ${stat.icon}`} />
              </div>
            )}
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="feature-page-actions">
        {actions.map((action, index) => (
          <Button
            key={index}
            label={action.label}
            icon={action.icon}
            onClick={action.onClick}
            className={`feature-action-btn ${action.variant || 'primary'}`}
            outlined={action.outlined}
            size="large"
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="feature-page-loading">
        <div className="loading-spinner">
          <i className="pi pi-spin pi-spinner" />
        </div>
        <p>Loading {title}...</p>
      </div>
    );
  }

  return (
    <div className={`feature-page ${animated ? 'animated' : ''} ${isVisible ? 'visible' : ''} ${className}`}>
      {/* Header Section */}
      <div className="feature-page-header" style={gradientStyle}>
        <div className="header-background-pattern" />
        <div className="header-content">
          {renderBreadcrumbs()}
          
          <div className="header-main">
            <div className="header-text">
              <div className="title-section">
                {icon && (
                  <div className="feature-icon">
                    <i className={`pi ${icon}`} />
                  </div>
                )}
                <div className="title-content">
                  <h1 className="feature-title">
                    {title}
                    {badge && (
                      <Badge
                        value={badge.text}
                        severity={badge.severity || 'info'}
                        className="feature-badge"
                      />
                    )}
                  </h1>
                  {subtitle && (
                    <p className="feature-subtitle">{subtitle}</p>
                  )}
                </div>
              </div>
              
              <p className="feature-description">{description}</p>
            </div>
            
            {renderActions()}
          </div>
          
          {renderStats()}
        </div>
        
        {/* Decorative elements */}
        <div className="header-decoration">
          <div className="decoration-circle decoration-1" />
          <div className="decoration-circle decoration-2" />
          <div className="decoration-circle decoration-3" />
        </div>
      </div>

      {/* Content Section */}
      <div className="feature-page-content">
        <div className="content-container">
          {children}
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" />
      </div>
    </div>
  );
};

export default FeaturePage;
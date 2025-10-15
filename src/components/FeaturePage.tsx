import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import './FeaturePage.scss';
import { ProgressSpinner } from 'primereact/progressspinner';

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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          maxWidth: '400px',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <ProgressSpinner 
              style={{ width: '4rem', height: '4rem' }} 
              strokeWidth="3"
              animationDuration="1s"
            />
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            margin: '0 0 1rem 0',
            color: 'white',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
          }}>
            Loading {title}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            margin: '0 0 2rem 0',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Please wait while we prepare your content...
          </p>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%)',
              borderRadius: '3px',
              animation: 'progress 2s ease-in-out infinite',
              boxShadow: '0 0 12px rgba(255, 255, 255, 0.6)'
            }}></div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.3rem'
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  animation: `loadingDots 1.4s ease-in-out infinite both`,
                  animationDelay: `${-0.32 + i * 0.16}s`
                }}
              />
            ))}
          </div>
        </div>
        <style>
          {`
            @keyframes progress {
              0% { width: 0%; opacity: 1; }
              50% { width: 70%; opacity: 0.8; }
              100% { width: 100%; opacity: 0.6; }
            }
            @keyframes loadingDots {
              0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
              40% { transform: scale(1.2); opacity: 1; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div 
      className={`feature-page ${animated ? 'animated' : ''} ${isVisible ? 'visible' : ''} ${className}`}
    >
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
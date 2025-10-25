import React from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import { ProgressBar } from 'primereact/progressbar';
import { Tooltip } from 'primereact/tooltip';
import './AIDetectionResults.scss';

interface AIFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  suggestion: string;
}

interface AIMetrics {
  sentenceVariability: number;
  vocabularyDiversity: number;
  naturalFlow: number;
  personalityPresence: number;
  burstiness: number;
  perplexity: number;
}

interface AIAnalysisResult {
  overallScore: number;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  summary: string;
  flags: AIFlag[];
  metrics: AIMetrics;
  recommendations: string[];
}

interface AIDetectionResultsProps {
  analysisResult: AIAnalysisResult;
  originalText: string;
  title?: string;
  className?: string;
}

const AIDetectionResults: React.FC<AIDetectionResultsProps> = ({
  analysisResult,
  originalText,
  title = "Detection Results",
  className = ""
}) => {
  const generateHighlightedText = (text: string, flags: AIFlag[]): string => {
    if (!flags || flags.length === 0) {
      return text;
    }

    // Sort flags by start index in descending order to avoid index shifting
    const sortedFlags = [...flags].sort((a, b) => b.startIndex - a.startIndex);
    
    let highlightedText = text;
    
    sortedFlags.forEach((flag, index) => {
      const flagText = text.substring(flag.startIndex, flag.endIndex);
      const severityClass = getSeverityClass(flag.severity);
      const flagId = `flag-${index}`;
      
      // Escape HTML attributes properly
      const escapedDescription = flag.description
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      const highlightedSpan = `<span class="ai-flag ${severityClass}" data-pr-tooltip="${escapedDescription}" data-pr-position="top" data-flag-id="${flagId}" data-severity="${flag.severity}" data-confidence="${flag.confidence}">${flagText}</span>`;
      
      highlightedText = 
        highlightedText.substring(0, flag.startIndex) +
        highlightedSpan +
        highlightedText.substring(flag.endIndex);
    });
    
    return highlightedText;
  };

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  // Map severity string (critical/high/medium/low) to a CSS class used by SCSS
  const severityClassFromSeverity = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  // Map overall score to a severity class
  const scoreSeverityClassFromScore = (score: number): string => {
    if (score >= 80) return 'severity-critical';
    if (score >= 60) return 'severity-high';
    if (score >= 40) return 'severity-medium';
    if (score >= 20) return 'severity-low';
    return 'severity-low';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Very Likely AI';
    if (score >= 60) return 'Likely AI';
    if (score >= 40) return 'Possibly AI';
    if (score >= 20) return 'Unlikely AI';
    return 'Likely Human';
  };

  const highlightedText = generateHighlightedText(originalText, analysisResult.flags);

  return (
    <div className={`ai-detection-results ${className}`}>
      {/* Tooltip for AI flags */}
      <Tooltip target=".ai-flag" />
      
      {/* Overall Score */}
      <Card className="score-card">
        <div className="score-header">
          <h3>
            <i className="pi pi-chart-pie" />
            {title}
          </h3>
        </div>
        
        <div className="score-content">
          <div className="overall-score">
            {(() => {
              const scoreClass = scoreSeverityClassFromScore(analysisResult.overallScore);
              return (
                <>
                  <div className={`score-circle ${scoreClass}`}>
                    <span className={`score-number ${scoreClass}`}>
                      {analysisResult.overallScore}%
                    </span>
                    <span className="score-label">{getScoreLabel(analysisResult.overallScore)}</span>
                  </div>

                  <div className="confidence-badge">
                    <Badge
                      value={`${analysisResult.confidence.replace('_', ' ').toUpperCase()} CONFIDENCE`}
                      className={scoreClass}
                    />
                  </div>
                </>
              );
            })()}
          </div>
          
          <div className="score-summary">
            <p>{analysisResult.summary}</p>
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <Card className="metrics-card">
        <div className="metrics-header">
          <h3>
            <i className="pi pi-chart-bar" />
            Analysis Metrics
          </h3>
        </div>
        
        <div className="metrics-grid">
          {Object.entries(analysisResult.metrics).map(([key, value]) => {
            const getProgressClass = (val: number): string => {
              if (val > 70) return 'progress-good';
              if (val > 50) return 'progress-medium';
              return 'progress-poor';
            };
            
            return (
              <div key={key} className="metric-item">
                <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                <ProgressBar 
                  value={value} 
                  className={getProgressClass(value)}
                  style={{ height: '22px' }}
                />
                <span className="metric-value">{value}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Flagged Content - Always Show */}
      <Card className="flags-card">
        <div className="flags-header">
          <h3>
            <i className="pi pi-flag" />
            Detected Patterns ({analysisResult.flags.length})
          </h3>
        </div>
        
        <div className="highlighted-text-container">
          <h4>Highlighted Text</h4>
          <div 
            className="highlighted-text"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
          
          {analysisResult.flags.length > 0 && (
            <div className="legend">
              <h5>Legend:</h5>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="legend-color severity-critical"></span>
                  Critical Issues
                </span>
                <span className="legend-item">
                  <span className="legend-color severity-high"></span>
                  High Issues
                </span>
                <span className="legend-item">
                  <span className="legend-color severity-medium"></span>
                  Medium Issues
                </span>
                <span className="legend-item">
                  <span className="legend-color severity-low"></span>
                  Low Issues
                </span>
              </div>
            </div>
          )}
        </div>
        
        <Divider />
        
        <div className="flags-list">
          <h4>Detailed Flags</h4>
          {analysisResult.flags.length > 0 ? (
            analysisResult.flags.map((flag, index) => (
              <Panel 
                key={index} 
                className="flag-panel" 
                toggleable 
                collapsed
                header={
                  <div className="panel-header">
                    <span className={`flag-type ${severityClassFromSeverity(flag.severity)}`}>
                      {flag.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className={`flag-confidence ${severityClassFromSeverity(flag.severity)}`}>
                      {flag.confidence}%
                    </span>
                  </div>
                }
              >
                <div className="flag-summary">
                  <div className="flag-info">
                    <Tag 
                      value={flag.type.replace(/_/g, ' ').toUpperCase()}
                      severity={flag.severity === 'critical' || flag.severity === 'high' ? 'danger' : 
                               flag.severity === 'medium' ? 'warning' : 'info'}
                    />
                    <Badge 
                      value={`${flag.confidence}%`}
                      className={severityClassFromSeverity(flag.severity)}
                    />
                  </div>
                  <span className="flag-text">"{flag.text}"</span>
                </div>
                
                <div className="flag-details">
                  <p><strong>Issue:</strong> {flag.description}</p>
                  <p><strong>Suggestion:</strong> {flag.suggestion}</p>
                  <p><strong>Location:</strong> Characters {flag.startIndex}-{flag.endIndex}</p>
                </div>
              </Panel>
            ))
          ) : (
            <div className="no-flags-message">
                <div className="success-icon">
                  <i className="pi pi-check-circle"></i>
                </div>
                <h5>No AI Patterns Detected</h5>
                <p>
                  The analysis found no concerning AI-generated patterns in this content. 
                  The text appears to demonstrate natural human writing characteristics.
                </p>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      {analysisResult.recommendations.length > 0 && (
        <Card className="recommendations-card">
          <div className="recommendations-header">
            <h3>
              <i className="pi pi-lightbulb" />
              Recommendations
            </h3>
          </div>
          
          <div className="recommendations-list">
            {analysisResult.recommendations.map((recommendation, index) => (
              <Chip key={index} label={recommendation} className="recommendation-chip" />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIDetectionResults;
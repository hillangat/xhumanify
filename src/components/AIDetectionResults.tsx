import React from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import { ProgressBar } from 'primereact/progressbar';
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
      
      const highlightedSpan = `<span class="ai-flag ${severityClass}" data-flag-id="${flagId}" data-severity="${flag.severity}" data-confidence="${flag.confidence}" title="${flag.description}">${flagText}</span>`;
      
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

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#20c997';
      default: return '#6c757d';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#dc3545';
    if (score >= 60) return '#fd7e14';
    if (score >= 40) return '#ffc107';
    if (score >= 20) return '#17a2b8';
    return '#28a745';
  };

  const getScoreSeverityColor = (score: number): string => {
    // For confidence badges - use severity colors based on how concerning the AI detection is
    if (score >= 80) return '#dc3545';  // Critical - very likely AI
    if (score >= 60) return '#fd7e14';  // High - likely AI  
    if (score >= 40) return '#ffc107';  // Medium - possibly AI
    if (score >= 20) return '#20c997';  // Low - unlikely AI
    return '#28a745';                   // Very low - likely human
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
            <div 
              className="score-circle"
              style={{ borderColor: getScoreSeverityColor(analysisResult.overallScore) }}
            >
              <span className="score-number" style={{ color: getScoreColor(analysisResult.overallScore) }}>
                {analysisResult.overallScore}%
              </span>
              <span className="score-label">{getScoreLabel(analysisResult.overallScore)}</span>
            </div>
            
            <div className="confidence-badge">
              <Badge
                value={`${analysisResult.confidence.replace('_', ' ').toUpperCase()} CONFIDENCE`}
                style={{ backgroundColor: getScoreSeverityColor(analysisResult.overallScore) }}
              />
            </div>
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
          {Object.entries(analysisResult.metrics).map(([key, value]) => (
            <div key={key} className="metric-item">
              <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
              <ProgressBar 
                value={value} 
                style={{ height: '22px' }}
                color={value > 70 ? '#28a745' : value > 50 ? '#ffc107' : '#dc3545'}
              />
              <span className="metric-value">{value}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Flagged Content */}
      {analysisResult.flags.length > 0 && (
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
          </div>
          
          <Divider />
          
          <div className="flags-list">
            <h4>Detailed Flags</h4>
            {analysisResult.flags.map((flag, index) => (
              <Panel 
                key={index} 
                className="flag-panel" 
                toggleable 
                collapsed
                header={
                  <div className="panel-header">
                    <span 
                      className="flag-type"
                      style={{ color: getSeverityColor(flag.severity) }}
                    >
                      {flag.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span 
                      className="flag-confidence"
                      style={{ backgroundColor: getSeverityColor(flag.severity) }}
                    >
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
                      style={{ backgroundColor: getSeverityColor(flag.severity) }}
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
            ))}
          </div>
        </Card>
      )}

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
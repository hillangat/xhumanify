import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import { ProgressBar } from 'primereact/progressbar';
import FeaturePage from './FeaturePage';
import './AIDetectionPage.scss';

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

interface DetectionResponse {
  analysis: AIAnalysisResult;
  originalText: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedWords: number;
  };
}

const AIDetectionPage: React.FC = () => {
  const client = generateClient<Schema>();
  const toast = useRef<Toast>(null);

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [highlightedText, setHighlightedText] = useState('');

  const handleAnalyzeText = async () => {
    if (!inputText.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Input Required',
        detail: 'Please enter some text to analyze for AI detection.',
        life: 3000
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setHighlightedText('');

    try {
      const response = await client.queries.detectAIContent({ text: inputText });
      
      if (response.data) {
        const result: DetectionResponse = JSON.parse(response.data);
        setAnalysisResult(result.analysis);
        
        // Generate highlighted text
        const highlighted = generateHighlightedText(inputText, result.analysis.flags);
        setHighlightedText(highlighted);

        toast.current?.show({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: `AI detection analysis completed with ${result.analysis.flags.length} flags identified.`,
          life: 3000
        });
      }
    } catch (error) {
      console.error('AI detection analysis failed:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: 'Failed to analyze text for AI content. Please try again.',
        life: 5000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'very_high': return '#dc3545';
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

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Very Likely AI';
    if (score >= 60) return 'Likely AI';
    if (score >= 40) return 'Possibly AI';
    if (score >= 20) return 'Unlikely AI';
    return 'Likely Human';
  };

  const clearAnalysis = () => {
    setInputText('');
    setAnalysisResult(null);
    setHighlightedText('');
  };

  return (
    <FeaturePage
      title="AI Content Detection"
      subtitle="Analyze Text for AI-Generated Content Patterns"
      description="Our advanced AI detection system analyzes text for patterns commonly found in AI-generated content. Get detailed feedback with specific flags, confidence scores, and recommendations for making content more human-like."
      icon="pi pi-search"
      badge={{
        text: "Advanced Analysis",
        severity: "warning"
      }}
      stats={[
        {
          label: "Detection Accuracy",
          value: "94%",
          icon: "pi pi-check-circle",
          color: "success"
        },
        {
          label: "Analysis Types",
          value: "12+",
          icon: "pi pi-list",
          color: "info"
        },
        {
          label: "Flag Categories",
          value: "15+",
          icon: "pi pi-flag",
          color: "warning"
        },
        {
          label: "Response Time",
          value: "<10s",
          icon: "pi pi-clock",
          color: "primary"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: 'pi pi-home' },
        { label: 'AI Detection', url: '/ai-detection', icon: 'pi pi-search' }
      ]}
      actions={[
        {
          label: "Clear Analysis",
          icon: "pi pi-refresh",
          onClick: clearAnalysis,
          variant: "secondary"
        }
      ]}
      loading={false}
      className="ai-detection-page-wrapper"
    >
      <div className="ai-detection-page">
        <Toast ref={toast} position="top-right" className="app-toast" />

        <div className="analysis-container">
          {/* Input Section */}
          <Card className="input-section">
            <div className="input-header">
              <h3>
                <i className="pi pi-file-edit" />
                Text to Analyze
              </h3>
              <p>Paste or type the text you want to analyze for AI-generated content patterns.</p>
            </div>
            
            <div className="input-controls">
              <InputTextarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter the text you want to analyze for AI-generated content patterns. The more text you provide, the more accurate the analysis will be..."
                rows={8}
                className="analysis-input"
                disabled={isAnalyzing}
              />
              
              <div className="input-footer">
                <div className="text-stats">
                  <span>Characters: {inputText.length}</span>
                  <span>Words: {inputText.trim() ? inputText.trim().split(/\\s+/).length : 0}</span>
                </div>
                
                <Button
                  label={isAnalyzing ? "Analyzing..." : "Analyze Text"}
                  icon={isAnalyzing ? "pi pi-spin pi-spinner" : "pi pi-search"}
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="analyze-button"
                  size="large"
                />
              </div>
            </div>
          </Card>

          {/* Results Section */}
          {analysisResult && (
            <div className="results-section">
              {/* Overall Score */}
              <Card className="score-card">
                <div className="score-header">
                  <h3>
                    <i className="pi pi-chart-pie" />
                    Detection Results
                  </h3>
                </div>
                
                <div className="score-content">
                  <div className="overall-score">
                    <div className="score-circle">
                      <span className="score-number" style={{ color: getScoreColor(analysisResult.overallScore) }}>
                        {analysisResult.overallScore}%
                      </span>
                      <span className="score-label">{getScoreLabel(analysisResult.overallScore)}</span>
                    </div>
                    
                    <div className="confidence-badge">
                      <Badge
                        value={`${analysisResult.confidence.replace('_', ' ').toUpperCase()} CONFIDENCE`}
                        style={{ backgroundColor: getConfidenceColor(analysisResult.confidence) }}
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
                      <Panel key={index} className="flag-panel" toggleable collapsed>
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
          )}
        </div>
      </div>
    </FeaturePage>
  );
};

export default AIDetectionPage;
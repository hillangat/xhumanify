import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';
import FeaturePage from './FeaturePage';
import useRetryableRequest from '../hooks/useRetryableRequest';
import './AIDetectionPage.scss';

interface PipelineResponse {
  success: boolean;
  pipeline: {
    originalText: string;
    originalAnalysis: {
      overall_assessment: {
        ai_likelihood: number;
        confidence_level: 'high' | 'medium' | 'low';
        primary_indicators: string[];
      };
      detailed_flags: Array<{
        category: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        examples: string[];
        recommendation: string;
      }>;
      human_like_elements: string[];
      recommendations: string[];
    };
    humanizedText: string;
    humanizedAnalysis?: {
      overall_assessment: {
        ai_likelihood: number;
        confidence_level: 'high' | 'medium' | 'low';
        primary_indicators: string[];
      };
      detailed_flags: Array<{
        category: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        examples: string[];
        recommendation: string;
      }>;
      human_like_elements: string[];
      recommendations: string[];
    };
    throttled: boolean;
  };
  usage: {
    detection: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    humanization: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    total: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  };
}

// Helper functions for styling and severity mapping
const getScoreClass = (score: number) => {
  if (score >= 80) return 'high-ai';
  if (score >= 60) return 'medium-ai';
  if (score >= 30) return 'low-ai';
  return 'human-like';
};

const getConfidenceSeverity = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'success';
    case 'medium': return 'warning';
    case 'low': return 'danger';
    default: return 'info';
  }
};

const getFlagSeverity = (severity: string) => {
  switch (severity) {
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'secondary';
  }
};

const AIDetectionPage: React.FC = () => {
  const client = generateClient<Schema>();
  const toast = useRef<Toast>(null);

  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<PipelineResponse | null>(null);

  // Retryable request hook for pipeline processing
  const {
    execute: executeAnalysis,
    cancel,
    isLoading: isAnalyzing,
    isRetrying,
    retryCount,
    nextRetryIn,
    error
  } = useRetryableRequest(
    async () => {
      const response = await client.queries.processContentPipeline({ text: inputText, tone: 'neutral' });
      if (!response.data) {
        throw new Error('No response data received');
      }
      return JSON.parse(response.data) as PipelineResponse;
    },
    {
      maxRetries: 3,
      baseDelay: 5000, // 5 seconds
      maxDelay: 60000, // 60 seconds
      onRetry: (attempt, delay) => {
        toast.current?.show({
          severity: 'info',
          summary: 'Retrying Analysis',
          detail: `Service is busy. Retrying in ${Math.ceil(delay / 1000)} seconds... (Attempt ${attempt}/3)`,
          life: Math.min(delay, 5000)
        });
      },
      onError: (error, _attempt) => {
        console.error('AI detection failed after all retries:', error);
        
        const isThrottling = error?.metadata?.isThrottling || 
                           error?.error?.includes('Throttling') ||
                           error?.error?.includes('Too many requests');
        
        if (isThrottling) {
          toast.current?.show({
            severity: 'error',
            summary: 'Service Unavailable',
            detail: 'The AI detection service is experiencing high demand. Please try again in a few minutes.',
            life: 8000
          });
        } else {
          toast.current?.show({
            severity: 'error',
            summary: 'Analysis Failed',
            detail: error?.analysis?.summary || 'Unable to complete AI detection analysis. Please try again.',
            life: 5000
          });
        }
      }
    }
  );

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

    setAnalysisResult(null);

    try {
      toast.current?.show({
        severity: 'info',
        summary: 'Pipeline Started',
        detail: 'Running AI detection and humanization sequentially...',
        life: 3000
      });

      const result = await executeAnalysis();
      setAnalysisResult(result);

      const flagCount = result.pipeline.originalAnalysis.detailed_flags.length;
      const improvement = result.pipeline.humanizedAnalysis ? 
        result.pipeline.originalAnalysis.overall_assessment.ai_likelihood - result.pipeline.humanizedAnalysis.overall_assessment.ai_likelihood : 0;
      
      toast.current?.show({
        severity: 'success',
        summary: 'Pipeline Complete',
        detail: result.pipeline.throttled ? 
          `Analysis completed with ${flagCount} flags identified. Humanization was throttled - try again later.` :
          `Analysis and humanization completed! Improved AI likelihood by ${improvement.toFixed(1)}%.`,
        life: 5000
      });
    } catch (error: any) {
      // Error handling is done in the onError callback
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setInputText('');
    cancel(); // Cancel any ongoing retries
  };

  const retryAnalysis = () => {
    handleAnalyzeText();
  };

  return (
    <FeaturePage
      title="AI Content Detection"
      subtitle="Advanced AI detection to identify artificially generated text patterns"
      description="Our sophisticated AI detection system analyzes text for patterns commonly found in AI-generated content, providing detailed insights and recommendations for improvement."
      stats={[
        {
          label: "Accuracy Rate",
          value: "94.2%",
          icon: "pi pi-check-circle",
          color: "success"
        },
        {
          label: "Analysis Speed", 
          value: "<30s",
          icon: "pi pi-clock",
          color: "primary"
        },
        {
          label: "Pattern Types",
          value: "11+",
          icon: "pi pi-list",
          color: "info"
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
        },
        ...(error && error.metadata?.retryable ? [{
          label: "Retry Analysis",
          icon: "pi pi-replay", 
          onClick: retryAnalysis,
          variant: "primary" as const
        }] : [])
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
                  <span>Words: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</span>
                </div>
                
                <div className="analysis-controls">
                  {isRetrying && (
                    <div className="retry-status">
                      <Chip 
                        label={`Retrying in ${nextRetryIn}s (${retryCount}/3)`}
                        icon="pi pi-clock"
                        className="retry-chip"
                      />
                      <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={cancel}
                        size="small"
                        text
                      />
                    </div>
                  )}
                  
                  <Button
                    label={isAnalyzing ? (isRetrying ? "Retrying Pipeline..." : "Processing Pipeline...") : "Analyze & Humanize"}
                    icon={isAnalyzing ? "pi pi-spin pi-spinner" : "pi pi-cog"}
                    onClick={handleAnalyzeText}
                    disabled={isAnalyzing || !inputText.trim()}
                    className="analyze-button"
                    size="large"
                    severity={isRetrying ? "warning" : undefined}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Progress indicator during retries */}
          {isRetrying && (
            <Card className="retry-progress">
              <div className="retry-info">
                <h4>Analysis in Progress</h4>
                <p>The service is experiencing high demand. Automatically retrying...</p>
                <ProgressBar 
                  value={((3 - retryCount) / 3) * 100} 
                  showValue={false}
                  className="retry-progress-bar"
                />
                <div className="retry-details">
                  <span>Attempt {retryCount} of 3</span>
                  {nextRetryIn > 0 && <span>Next retry in {nextRetryIn}s</span>}
                </div>
              </div>
            </Card>
          )}

          {/* Results Section - Side by Side Comparison */}
          {analysisResult && analysisResult.success && (
            <div className="pipeline-results">
              <div className="results-grid">
                {/* Original Content Analysis */}
                <Card className="original-results">
                  <div className="result-header">
                    <h3>
                      <i className="pi pi-file-edit" />
                      Original Content Analysis
                    </h3>
                    <div className="analysis-score">
                      <Chip 
                        label={`${analysisResult.pipeline.originalAnalysis.overall_assessment.ai_likelihood}% AI-like`}
                        className={`score-chip ${getScoreClass(analysisResult.pipeline.originalAnalysis.overall_assessment.ai_likelihood)}`}
                      />
                      <Badge 
                        value={analysisResult.pipeline.originalAnalysis.overall_assessment.confidence_level.toUpperCase()}
                        severity={getConfidenceSeverity(analysisResult.pipeline.originalAnalysis.overall_assessment.confidence_level)}
                      />
                    </div>
                  </div>
                  
                  <div className="content-preview">
                    <h4>Content Preview</h4>
                    <div className="text-preview">
                      {analysisResult.pipeline.originalText.substring(0, 300)}
                      {analysisResult.pipeline.originalText.length > 300 && '...'}
                    </div>
                  </div>
                  
                  <div className="flags-summary">
                    <h4>Detection Flags ({analysisResult.pipeline.originalAnalysis.detailed_flags.length})</h4>
                    {analysisResult.pipeline.originalAnalysis.detailed_flags.map((flag, index) => (
                      <div key={index} className={`flag-item ${flag.severity}`}>
                        <div className="flag-header">
                          <strong>{flag.category}</strong>
                          <Badge value={flag.severity.toUpperCase()} severity={getFlagSeverity(flag.severity)} />
                        </div>
                        <p>{flag.description}</p>
                        <div className="flag-examples">
                          {flag.examples.map((example, exIndex) => (
                            <Chip key={exIndex} label={example} className="example-chip" />
                          ))}
                        </div>
                        <div className="flag-recommendation">
                          <small><strong>Suggestion:</strong> {flag.recommendation}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Humanized Content Analysis */}
                <Card className="humanized-results">
                  <div className="result-header">
                    <h3>
                      <i className="pi pi-user" />
                      Humanized Content Analysis
                    </h3>
                    {!analysisResult.pipeline.throttled && analysisResult.pipeline.humanizedAnalysis ? (
                      <div className="analysis-score">
                        <Chip 
                          label={`${analysisResult.pipeline.humanizedAnalysis.overall_assessment.ai_likelihood}% AI-like`}
                          className={`score-chip ${getScoreClass(analysisResult.pipeline.humanizedAnalysis.overall_assessment.ai_likelihood)}`}
                        />
                        <Badge 
                          value={analysisResult.pipeline.humanizedAnalysis.overall_assessment.confidence_level.toUpperCase()}
                          severity={getConfidenceSeverity(analysisResult.pipeline.humanizedAnalysis.overall_assessment.confidence_level)}
                        />
                        <div className="improvement-badge">
                          {(() => {
                            const improvement = analysisResult.pipeline.originalAnalysis.overall_assessment.ai_likelihood - 
                                              analysisResult.pipeline.humanizedAnalysis.overall_assessment.ai_likelihood;
                            return improvement > 0 ? (
                              <Chip 
                                label={`↓ ${improvement.toFixed(1)}% improvement`}
                                className="improvement-chip positive"
                                icon="pi pi-arrow-down"
                              />
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="throttled-notice">
                        <Chip 
                          label="Humanization Throttled" 
                          icon="pi pi-exclamation-triangle"
                          className="throttled-chip"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="content-preview">
                    <h4>Humanized Content Preview</h4>
                    <div className="text-preview">
                      {analysisResult.pipeline.humanizedText.substring(0, 300)}
                      {analysisResult.pipeline.humanizedText.length > 300 && '...'}
                    </div>
                  </div>
                  
                  {analysisResult.pipeline.humanizedAnalysis && (
                    <div className="flags-summary">
                      <h4>Remaining Flags ({analysisResult.pipeline.humanizedAnalysis.detailed_flags.length})</h4>
                      {analysisResult.pipeline.humanizedAnalysis.detailed_flags.length === 0 ? (
                        <div className="no-flags">
                          <i className="pi pi-check-circle" />
                          <span>No AI detection flags found! Content appears human-written.</span>
                        </div>
                      ) : (
                        analysisResult.pipeline.humanizedAnalysis.detailed_flags.map((flag, index) => (
                          <div key={index} className={`flag-item ${flag.severity}`}>
                            <div className="flag-header">
                              <strong>{flag.category}</strong>
                              <Badge value={flag.severity.toUpperCase()} severity={getFlagSeverity(flag.severity)} />
                            </div>
                            <p>{flag.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              </div>
              
              {/* Usage Statistics */}
              <Card className="usage-stats">
                <h4>Processing Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Tokens Used</span>
                    <span className="stat-value">{analysisResult.usage.total.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Detection Tokens</span>
                    <span className="stat-value">{analysisResult.usage.detection.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Humanization Tokens</span>
                    <span className="stat-value">{analysisResult.usage.humanization.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Processing Mode</span>
                    <span className="stat-value">Sequential Pipeline</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  );
};

export default AIDetectionPage;
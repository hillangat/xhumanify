import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import FeaturePage from './FeaturePage';
import AIDetectionResults from './AIDetectionResults';
import useRetryableRequest from '../hooks/useRetryableRequest';
import './AIDetectionPage.scss';

interface DetectionResponse {
  analysis: {
    overallScore: number;
    confidence: 'low' | 'medium' | 'high' | 'very_high';
    summary: string;
    flags: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      text: string;
      startIndex: number;
      endIndex: number;
      confidence: number;
      suggestion: string;
    }>;
    metrics: {
      sentenceVariability: number;
      vocabularyDiversity: number;
      naturalFlow: number;
      personalityPresence: number;
      burstiness: number;
      perplexity: number;
    };
    recommendations: string[];
  };
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
  const [analysisResult, setAnalysisResult] = useState<DetectionResponse | null>(null);

  // Retryable request hook for AI detection
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
      const response = await client.queries.detectAIContent({ 
        text: inputText,
        forceMode: 'natural', // Use natural mode for standalone detection
        maxScore: 100 // Allow full score range
      });
      if (!response.data) {
        throw new Error('No response data received');
      }
      return JSON.parse(response.data) as DetectionResponse;
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
        summary: 'Analysis Started',
        detail: 'Running AI detection analysis...',
        life: 3000
      });

      const result = await executeAnalysis();
      setAnalysisResult(result);

      toast.current?.show({
        severity: 'success',
        summary: 'Analysis Complete',
        detail: `AI detection analysis completed with ${result.analysis.flags.length} flags identified.`,
        life: 3000
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
                    label={isAnalyzing ? (isRetrying ? "Retrying..." : "Analyzing...") : "Analyze Text"}
                    icon={isAnalyzing ? "pi pi-spin pi-spinner" : "pi pi-search"}
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

          {/* Results Section */}
          {analysisResult && (
            <AIDetectionResults
              analysisResult={analysisResult.analysis}
              originalText={analysisResult.originalText}
              title="Detection Results"
            />
          )}
        </div>
      </div>
    </FeaturePage>
  );
};

export default AIDetectionPage;
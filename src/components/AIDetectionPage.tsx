import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import FeaturePage from './FeaturePage';
import AIDetectionResults from './AIDetectionResults';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DetectionResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Advanced retry logic with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 4): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error);
        
        // Check if it's a throttling error
        const isThrottling = error.message?.includes('ThrottlingException') || 
                           error.message?.includes('Too many requests') ||
                           error.message?.includes('rate limit') ||
                           error.name === 'ThrottlingException';
        
        if (isThrottling && attempt < maxRetries) {
          const delay = Math.min(Math.pow(2, attempt) * 2000 + Math.random() * 1000, 30000);
          console.log(`Throttling detected, waiting ${delay}ms before retry ${attempt + 1}...`);
          
          setIsRetrying(true);
          toast.current?.show({
            severity: 'info',
            summary: 'Service Busy',
            detail: `Analysis queue is busy. Retrying in ${Math.round(delay / 1000)} seconds... (Attempt ${attempt}/${maxRetries})`,
            life: delay > 5000 ? delay : 5000
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          setIsRetrying(false);
          continue;
        }
        
        // For non-throttling errors or final attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Short delay for other types of errors
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

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

    try {
      toast.current?.show({
        severity: 'info',
        summary: 'Analysis Started',
        detail: 'Running AI detection analysis. This may take a moment...',
        life: 3000
      });

      const response = await retryWithBackoff(async () => {
        return await client.queries.detectAIContent({ text: inputText });
      });
      
      if (response.data) {
        const result: DetectionResponse = JSON.parse(response.data);
        setAnalysisResult(result);

        toast.current?.show({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: `AI detection analysis completed with ${result.analysis.flags.length} flags identified.`,
          life: 3000
        });
      }
    } catch (error: any) {
      console.error('AI detection analysis failed:', error);
      
      const isThrottling = error.message?.includes('ThrottlingException') || 
                         error.message?.includes('Too many requests') ||
                         error.message?.includes('rate limit');
      
      if (isThrottling) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Service Temporarily Unavailable',
          detail: 'AI detection service is experiencing high demand. Please wait a few moments and try again.',
          life: 8000
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Analysis Failed',
          detail: 'Failed to analyze text for AI content. Please try again in a moment.',
          life: 5000
        });
      }
    } finally {
      setIsAnalyzing(false);
      setIsRetrying(false);
    }
  };

  const clearAnalysis = () => {
    setInputText('');
    setAnalysisResult(null);
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
          </Card>

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
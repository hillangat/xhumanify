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
      const response = await client.queries.detectAIContent({ text: inputText });
      
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
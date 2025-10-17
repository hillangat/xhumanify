import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import FeaturePage from './FeaturePage';
import AIDetectionResults from './AIDetectionResults';
import './AIDetectionComparison.scss';

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

interface AIDetectionComparisonProps {
  rawText: string;
  processedText: string;
  onRawTextChange?: (text: string) => void;
  onProcessedTextChange?: (text: string) => void;
  readOnly?: boolean;
}

const AIDetectionComparison: React.FC<AIDetectionComparisonProps> = ({
  rawText,
  processedText,
  onRawTextChange,
  onProcessedTextChange,
  readOnly = false
}) => {
  const client = generateClient<Schema>();
  const toast = useRef<Toast>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawAnalysis, setRawAnalysis] = useState<DetectionResponse | null>(null);
  const [processedAnalysis, setProcessedAnalysis] = useState<DetectionResponse | null>(null);

  const handleAnalyzeBoth = async () => {
    if (!rawText.trim() && !processedText.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Input Required',
        detail: 'Please provide text in at least one of the input areas.',
        life: 3000
      });
      return;
    }

    setIsAnalyzing(true);
    setRawAnalysis(null);
    setProcessedAnalysis(null);

    try {
      const promises = [];
      
      if (rawText.trim()) {
        promises.push(
          client.queries.detectAIContent({ text: rawText })
            .then(response => ({ type: 'raw', response }))
        );
      }
      
      if (processedText.trim()) {
        promises.push(
          client.queries.detectAIContent({ text: processedText })
            .then(response => ({ type: 'processed', response }))
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach(({ type, response }) => {
        if (response.data) {
          const result: DetectionResponse = JSON.parse(response.data);
          if (type === 'raw') {
            setRawAnalysis(result);
          } else {
            setProcessedAnalysis(result);
          }
        }
      });

      const totalFlags = results.reduce((acc, { response }) => {
        if (response.data) {
          const result: DetectionResponse = JSON.parse(response.data);
          return acc + result.analysis.flags.length;
        }
        return acc;
      }, 0);

      toast.current?.show({
        severity: 'success',
        summary: 'Analysis Complete',
        detail: `AI detection analysis completed with ${totalFlags} total flags identified.`,
        life: 3000
      });
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
    if (onRawTextChange) onRawTextChange('');
    if (onProcessedTextChange) onProcessedTextChange('');
    setRawAnalysis(null);
    setProcessedAnalysis(null);
  };

  const getImprovementSummary = () => {
    if (!rawAnalysis || !processedAnalysis) return null;

    const rawScore = rawAnalysis.analysis.overallScore;
    const processedScore = processedAnalysis.analysis.overallScore;
    const improvement = rawScore - processedScore;
    const flagReduction = rawAnalysis.analysis.flags.length - processedAnalysis.analysis.flags.length;

    return {
      scoreImprovement: improvement,
      flagReduction: flagReduction,
      rawScore,
      processedScore
    };
  };

  const improvement = getImprovementSummary();

  return (
    <FeaturePage
      title="AI Detection Comparison"
      subtitle="Compare AI Detection Results Before and After Processing"
      description="Analyze and compare AI detection patterns between original content and processed content to see the effectiveness of humanization techniques."
      icon="pi pi-clone"
      badge={{
        text: "Side-by-Side Analysis",
        severity: "info"
      }}
      stats={[
        {
          label: "Comparison Mode",
          value: "Real-time",
          icon: "pi pi-sync",
          color: "primary"
        },
        {
          label: "Detection Types",
          value: "15+",
          icon: "pi pi-flag",
          color: "warning"
        },
        {
          label: "Improvement Tracking",
          value: "Advanced",
          icon: "pi pi-chart-line",
          color: "success"
        },
        {
          label: "Analysis Speed",
          value: "<10s",
          icon: "pi pi-bolt",
          color: "info"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: 'pi pi-home' },
        { label: 'AI Detection', url: '/ai-detection', icon: 'pi pi-search' },
        { label: 'Comparison', url: '/ai-detection-comparison', icon: 'pi pi-clone' }
      ]}
      actions={[
        {
          label: "Clear All",
          icon: "pi pi-refresh",
          onClick: clearAnalysis,
          variant: "secondary"
        }
      ]}
      loading={false}
      className="ai-detection-comparison-wrapper"
    >
      <div className="ai-detection-comparison">
        <Toast ref={toast} position="top-right" className="app-toast" />

        {/* Input Section */}
        <Card className="input-section">
          <div className="input-header">
            <h3>
              <i className="pi pi-clone" />
              Text Comparison
            </h3>
            <p>Enter your original and processed text to compare AI detection results side by side.</p>
          </div>
          
          <div className="input-grid">
            <div className="input-column">
              <h4>Original Text</h4>
              <InputTextarea
                value={rawText}
                onChange={(e) => onRawTextChange?.(e.target.value)}
                placeholder="Enter your original text here..."
                rows={8}
                className="comparison-input"
                disabled={isAnalyzing || readOnly}
              />
              <div className="text-stats">
                <span>Characters: {rawText.length}</span>
                <span>Words: {rawText.trim() ? rawText.trim().split(/\s+/).length : 0}</span>
              </div>
            </div>

            <div className="input-divider">
              <Divider layout="vertical" />
              <div className="vs-badge">VS</div>
            </div>

            <div className="input-column">
              <h4>Processed Text</h4>
              <InputTextarea
                value={processedText}
                onChange={(e) => onProcessedTextChange?.(e.target.value)}
                placeholder="Enter your processed/humanized text here..."
                rows={8}
                className="comparison-input"
                disabled={isAnalyzing || readOnly}
              />
              <div className="text-stats">
                <span>Characters: {processedText.length}</span>
                <span>Words: {processedText.trim() ? processedText.trim().split(/\s+/).length : 0}</span>
              </div>
            </div>
          </div>

          <div className="input-footer">
            <Button
              label={isAnalyzing ? "Analyzing..." : "Compare Both Texts"}
              icon={isAnalyzing ? "pi pi-spin pi-spinner" : "pi pi-clone"}
              onClick={handleAnalyzeBoth}
              disabled={isAnalyzing || (!rawText.trim() && !processedText.trim())}
              className="compare-button"
              size="large"
            />
          </div>
        </Card>

        {/* Improvement Summary */}
        {improvement && (
          <Card className="improvement-summary">
            <div className="summary-header">
              <h3>
                <i className="pi pi-chart-line" />
                Improvement Summary
              </h3>
            </div>
            <div className="summary-content">
              <div className="improvement-metric">
                <span className="metric-label">AI Score Reduction:</span>
                <span className={`metric-value ${improvement.scoreImprovement > 0 ? 'positive' : 'negative'}`}>
                  {improvement.scoreImprovement > 0 ? '-' : '+'}{Math.abs(improvement.scoreImprovement)}%
                </span>
              </div>
              <div className="improvement-metric">
                <span className="metric-label">Flags Reduced:</span>
                <span className={`metric-value ${improvement.flagReduction > 0 ? 'positive' : 'negative'}`}>
                  {improvement.flagReduction > 0 ? '-' : '+'}{Math.abs(improvement.flagReduction)} flags
                </span>
              </div>
              <div className="improvement-metric">
                <span className="metric-label">Final Score:</span>
                <span className="metric-value">
                  {improvement.rawScore}% → {improvement.processedScore}%
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Results Section */}
        {(rawAnalysis || processedAnalysis) && (
          <div className="results-section">
            <div className="results-grid">
              <div className="result-column">
                {rawAnalysis ? (
                  <AIDetectionResults
                    analysisResult={rawAnalysis.analysis}
                    originalText={rawAnalysis.originalText}
                    title="Original Text Results"
                    className="original-results"
                  />
                ) : (
                  <Card className="no-analysis">
                    <div className="no-analysis-content">
                      <i className="pi pi-info-circle" />
                      <h4>No Original Text Analysis</h4>
                      <p>Enter original text and run comparison to see results here.</p>
                    </div>
                  </Card>
                )}
              </div>

              <div className="result-column">
                {processedAnalysis ? (
                  <AIDetectionResults
                    analysisResult={processedAnalysis.analysis}
                    originalText={processedAnalysis.originalText}
                    title="Processed Text Results"
                    className="processed-results"
                  />
                ) : (
                  <Card className="no-analysis">
                    <div className="no-analysis-content">
                      <i className="pi pi-info-circle" />
                      <h4>No Processed Text Analysis</h4>
                      <p>Enter processed text and run comparison to see results here.</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeaturePage>
  );
};

export default AIDetectionComparison;
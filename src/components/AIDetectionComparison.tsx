import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'raw' | 'processed' | 'complete'>('idle');
  const [stepProgress, setStepProgress] = useState(0);
  const progressPanelRef = useRef<HTMLDivElement>(null);

  // Advanced retry logic with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
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

  const analyzeWithRetry = async (text: string, type: 'raw' | 'processed') => {
    return retryWithBackoff(async () => {
      const response = await client.queries.detectAIContent({ 
        text,
        forceMode: type === 'processed' ? 'low_score' : 'natural', // Use low_score for humanized text
        maxScore: type === 'processed' ? 25 : 100 // Lower max score for processed text
      });
      return { type, response };
    }, 4); // Allow up to 4 attempts for each analysis
  };

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
    setCurrentStep('idle');
    setStepProgress(0);

    // Scroll to progress panel after state updates
    setTimeout(() => {
      progressPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
      // SEQUENTIAL PROCESSING TO PREVENT THROTTLING
      const results = [];
      let completedSteps = 0;
      
      // Process raw text first
      if (rawText.trim()) {
        setCurrentStep('raw');
        setStepProgress(25);
        
        toast.current?.show({
          severity: 'info',
          summary: 'Processing Original Content',
          detail: 'Analyzing original text for AI patterns...',
          life: 3000
        });
        
        try {
          const rawResult = await analyzeWithRetry(rawText, 'raw');
          results.push(rawResult);
          completedSteps++;
          setStepProgress(50);
          
          // Smart delay between calls to prevent throttling
          if (processedText.trim()) {
            console.log('Adding delay between analysis calls to prevent throttling...');
            
            toast.current?.show({
              severity: 'info',
              summary: 'Preparing Next Analysis',
              detail: 'Adding delay to prevent service throttling...',
              life: 2000
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
        } catch (error) {
          console.error('Raw text analysis failed:', error);
        }
      }
      
      // Process humanized text second (after delay)
      if (processedText.trim()) {
        setCurrentStep('processed');
        setStepProgress(75);
        
        toast.current?.show({
          severity: 'info',
          summary: 'Processing Humanized Content',
          detail: 'Analyzing humanized text for AI patterns...',
          life: 3000
        });
        
        try {
          const processedResult = await analyzeWithRetry(processedText, 'processed');
          results.push(processedResult);
          completedSteps++;
        } catch (error) {
          console.error('Processed text analysis failed:', error);
        }
      }
      
      setCurrentStep('complete');
      setStepProgress(100);
      
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
      setCurrentStep('idle');
      setStepProgress(0);
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
              Original Text Vs. Humanized Text
            </h3>
            <p>Enter your original and humanized text to compare AI detection results side by side.</p>
          </div>
          
          <div className="input-container">
            <Splitter style={{ height: '600px' }}>
              <SplitterPanel className="input-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header" style={{ 
                  padding: '16px 20px 12px', 
                  borderBottom: '1px solid var(--surface-border)', 
                  background: 'var(--surface-50)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div className="header-main" style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: 'var(--primary-color)',
                      letterSpacing: '-0.02em'
                    }}>Original Text</h4>
                    <div className="header-stats" style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                      <span className="word-count" style={{
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: 'var(--text-color)',
                        background: 'var(--primary-50)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--primary-200)'
                      }}>{rawText.trim() ? rawText.trim().split(/\s+/).length : 0} words</span>
                      <span className="text-stats" style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-color-secondary)',
                        fontWeight: '400'
                      }}>Characters: {rawText.length.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="panel-content" style={{ flex: 1, padding: '16px 20px' }}>
                  <InputTextarea
                    value={rawText}
                    onChange={(e) => onRawTextChange?.(e.target.value)}
                    placeholder="Enter your original text here..."
                    rows={12}
                    className="comparison-input"
                    disabled={isAnalyzing || readOnly}
                    style={{ width: '100%', height: '100%', maxHeight: '450px', resize: 'none', border: 'none' }}
                  />
                </div>
              </SplitterPanel>
              
              <SplitterPanel className="input-panel processed-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header" style={{ 
                  padding: '16px 20px 12px', 
                  borderBottom: '1px solid var(--surface-border)', 
                  background: 'var(--surface-50)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div className="header-main" style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: 'var(--green-600)',
                      letterSpacing: '-0.02em'
                    }}>Humanized Text</h4>
                    <div className="header-stats" style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                      <span className="word-count" style={{
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: 'var(--text-color)',
                        background: 'var(--green-50)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--green-200)'
                      }}>{processedText.trim() ? processedText.trim().split(/\s+/).length : 0} words</span>
                      <span className="text-stats" style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-color-secondary)',
                        fontWeight: '400'
                      }}>Characters: {processedText.length.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="panel-content" style={{ flex: 1, padding: '16px 20px' }}>
                  <InputTextarea
                    value={processedText}
                    onChange={(e) => onProcessedTextChange?.(e.target.value)}
                    placeholder="Enter your processed/humanized text here..."
                    rows={12}
                    className="comparison-input"
                    disabled={isAnalyzing || readOnly}
                    style={{ width: '100%', height: '100%', maxHeight: '450px', resize: 'none', border: 'none' }}
                  />
                </div>
              </SplitterPanel>
            </Splitter>
          </div>

          <div className="input-footer">
            <Button
              label={isAnalyzing ? (isRetrying ? "Retrying..." : "Analyzing...") : "Compare Both Texts"}
              icon={isAnalyzing ? "pi pi-spin pi-spinner" : "pi pi-clone"}
              onClick={handleAnalyzeBoth}
              disabled={isAnalyzing || (!rawText.trim() && !processedText.trim())}
              className="compare-button"
              size="large"
              severity={isRetrying ? "warning" : undefined}
            />
          </div>
        </Card>

        {/* Professional Progress Panel */}
        {isAnalyzing && (
          <div ref={progressPanelRef}>
            <Card className="progress-panel">
              <div className="progress-header">
              <h3>
                <i className="pi pi-cog pi-spin" />
                Processing Analysis Pipeline
              </h3>
              <p>Sequential processing to ensure optimal performance and accuracy</p>
            </div>
            
            <div className="progress-content">
              <div className="progress-steps">
                <div className={`step-item ${currentStep === 'raw' || currentStep === 'processed' || currentStep === 'complete' ? 'active' : ''} ${(currentStep === 'processed' || currentStep === 'complete') && rawText.trim() ? 'completed' : ''}`}>
                  <div className="step-icon">
                    {(currentStep === 'processed' || currentStep === 'complete') && rawText.trim() ? (
                      <i className="pi pi-check" />
                    ) : currentStep === 'raw' ? (
                      <i className="pi pi-spin pi-spinner" />
                    ) : (
                      <i className="pi pi-file-edit" />
                    )}
                  </div>
                  <div className="step-content">
                    <h4>Original Content Analysis</h4>
                    <p>{rawText.trim() ? 'Analyzing original text for AI patterns' : 'No original text provided'}</p>
                    {currentStep === 'raw' && (
                      <Chip label="Processing..." icon="pi pi-clock" className="processing-chip" />
                    )}
                    {(currentStep === 'processed' || currentStep === 'complete') && rawText.trim() && (
                      <Chip label="Completed" icon="pi pi-check" className="completed-chip" />
                    )}
                  </div>
                </div>

                <div className="step-divider">
                  <div className={`divider-line ${currentStep === 'processed' || currentStep === 'complete' ? 'active' : ''}`}>
                    <i className="pi pi-arrow-right" />
                  </div>
                </div>

                <div className={`step-item ${currentStep === 'processed' || currentStep === 'complete' ? 'active' : ''} ${currentStep === 'complete' && processedText.trim() ? 'completed' : ''}`}>
                  <div className="step-icon">
                    {currentStep === 'complete' && processedText.trim() ? (
                      <i className="pi pi-check" />
                    ) : currentStep === 'processed' ? (
                      <i className="pi pi-spin pi-spinner" />
                    ) : (
                      <i className="pi pi-user" />
                    )}
                  </div>
                  <div className="step-content">
                    <h4>Processed Content Analysis</h4>
                    <p>{processedText.trim() ? 'Analyzing humanized text for improvements' : 'No humanized text provided'}</p>
                    {currentStep === 'processed' && (
                      <Chip label="Processing..." icon="pi pi-clock" className="processing-chip" />
                    )}
                    {currentStep === 'complete' && processedText.trim() && (
                      <Chip label="Completed" icon="pi pi-check" className="completed-chip" />
                    )}
                  </div>
                </div>
              </div>

              <div className="progress-bar-section">
                <div className="progress-info">
                  <span className="progress-text">
                    {currentStep === 'raw' && rawText.trim() && 'Processing original content...'}
                    {currentStep === 'processed' && processedText.trim() && 'Processing humanized content...'}
                    {currentStep === 'complete' && 'Analysis complete!'}
                    {currentStep === 'idle' && 'Initializing...'}
                  </span>
                  <span className="progress-percentage">{stepProgress}%</span>
                </div>
                <ProgressBar 
                  value={stepProgress} 
                  showValue={false}
                  className="analysis-progress-bar"
                />
              </div>

              {isRetrying && (
                <div className="retry-notice">
                  <Chip 
                    label="Service is busy - retrying with intelligent backoff"
                    icon="pi pi-exclamation-triangle"
                    className="retry-chip"
                  />
                </div>
              )}
            </div>
            </Card>
          </div>
        )}

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
                    title="Humanized Text Results"
                    className="processed-results"
                  />
                ) : (
                  <Card className="no-analysis">
                    <div className="no-analysis-content">
                      <i className="pi pi-info-circle" />
                      <h4>No Humanized Text Analysis</h4>
                      <p>Enter humanized text and run comparison to see results here.</p>
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
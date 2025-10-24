import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import './UsageBreakdownPopup.scss';

interface UsageBreakdownPopupProps {
  visible: boolean;
  onHide: () => void;
  usageInfo: any;
  inputWords: number;
  outputWords: number;
}

const UsageBreakdownPopup: React.FC<UsageBreakdownPopupProps> = ({
  visible,
  onHide,
  usageInfo,
  inputWords,
  outputWords
}) => {
  // NEW BILLING SYSTEM: Use enhanced billing data exclusively
  const billedWords = usageInfo.billedWords;
  const actualInputWords = usageInfo.inputWords;
  const actualOutputWords = usageInfo.outputWords;
  const totalActualWords = actualInputWords + actualOutputWords;
  
  // Billing transparency data
  const billingMethod = usageInfo.billingMethod;
  const billingNote = usageInfo.billingNote;
  
  // Character and token information for transparency
  const inputChars = usageInfo.inputChars || 0;
  const outputChars = usageInfo.outputChars || 0;
  const inputTokens = usageInfo.inputTokens || 0;
  const outputTokens = usageInfo.outputTokens || 0;
  const systemTokens = usageInfo.systemPromptTokens || 0;
  
  // Validation: Ensure we have new billing data
  if (!billedWords || !actualInputWords || !actualOutputWords || !billingMethod) {
    return (
      <Dialog
        header="Billing Information"
        visible={visible}
        onHide={onHide}
        modal
        className="usage-breakdown-dialog"
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--orange-500)' }}></i>
          <h3>New Billing System Required</h3>
          <p>This content was processed with the legacy billing system. Future requests will use our new transparent word-based billing.</p>
          <Button label="Close" onClick={onHide} />
        </div>
      </Dialog>
    );
  }
  const outputTokens = usageInfo.outputTokens || 0;
  const systemTokens = usageInfo.systemPromptTokens || 0;
  const billableTokens = inputTokens + outputTokens;
  
  // Character information (if available)
  const inputChars = usageInfo.inputChars || 0;
  const outputChars = usageInfo.outputChars || 0;
  
  // Determine if this is using the new enhanced billing
  const isEnhancedBilling = Boolean(usageInfo.billingMethod);
  
  // Calculate token-based estimate for comparison
  const tokenBasedEstimate = billableTokens > 0 ? Math.ceil(billableTokens / 1.3) : 0;

  return (
    <Dialog
      header="Usage Breakdown Explanation"
      visible={visible}
      onHide={onHide}
      footer={
        <div className="dialog-footer">
          <Button
            label="Got it!"
            onClick={onHide}
            icon="pi pi-check"
          />
        </div>
      }
      modal
      className="usage-breakdown-dialog"
      style={{ width: '90vw', maxWidth: '600px' }}
    >
      <div className="usage-explanation">
        {/* Clear Summary */}
        <div className="summary-section">
          <h3>📊 Billing Summary - {isEnhancedBilling ? 'Enhanced' : 'Legacy'} Method</h3>
          <div className="comparison-grid">
            <div className="actual-content">
              <h4>📝 Your Actual Content</h4>
              <div className="content-stats">
                <div>Input: <strong>{actualInputWords} words</strong></div>
                <div>Output: <strong>{actualOutputWords} words</strong></div>
                <div className="total">Total: <strong>{totalActualWords} words</strong></div>
                {(inputChars > 0 || outputChars > 0) && (
                  <div className="char-info">
                    ({inputChars + outputChars} characters total)
                  </div>
                )}
              </div>
            </div>
            <div className="charged-content">
              <h4>💰 What You're Charged</h4>
              <div className="charged-amount">
                <strong>{billedWords} words</strong>
              </div>
              {isEnhancedBilling && (
                <div className="billing-method">
                  Method: {billingMethod.replace(/-/g, ' ')}
                </div>
              )}
            </div>
          </div>
          {billingNote && (
            <div className="billing-note">
              <i className="pi pi-info-circle"></i>
              {billingNote}
            </div>
          )}
        </div>

        {/* How We Calculate Your Bill */}
        <div className="explanation-section">
          <h3>� How We Calculate Your Bill</h3>
          <p>
            {isEnhancedBilling ? (
              <>We use a <strong>word-count primary</strong> billing system for maximum transparency. 
              Your charge is based on the actual words in your input and output, with a token-based 
              fallback to ensure conservative billing.</>
            ) : (
              <>The system charges based on <strong>AI tokens</strong>, not actual word count. 
              Here's what happens behind the scenes:</>
            )}
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="token-section">
          <h3>⚡ Detailed Usage Breakdown</h3>
          
          {isEnhancedBilling ? (
            // Enhanced billing breakdown
            <div className="enhanced-breakdown">
              <div className="breakdown-method">
                <h4>📊 Primary Method: Word Count</h4>
                <div className="method-grid">
                  <div className="method-item">
                    <span className="method-label">Input words:</span>
                    <span className="method-value">{actualInputWords}</span>
                  </div>
                  <div className="method-item">
                    <span className="method-label">Output words:</span>
                    <span className="method-value">{actualOutputWords}</span>
                  </div>
                  <div className="method-item total">
                    <span className="method-label">Word-based total:</span>
                    <span className="method-value">{totalActualWords}</span>
                  </div>
                </div>
              </div>
              
              <div className="breakdown-method">
                <h4>🔧 Fallback Method: Token Count</h4>
                <div className="method-grid">
                  <div className="method-item">
                    <span className="method-label">Input tokens:</span>
                    <span className="method-value">{inputTokens}</span>
                    <span className="method-note">({actualInputWords} words + processing)</span>
                  </div>
                  <div className="method-item">
                    <span className="method-label">Output tokens:</span>
                    <span className="method-value">{outputTokens}</span>
                    <span className="method-note">({actualOutputWords} words from AI)</span>
                  </div>
                  {systemTokens > 0 && (
                    <div className="method-item free">
                      <span className="method-label">System tokens:</span>
                      <span className="method-value">{systemTokens}</span>
                      <span className="method-note">✅ FREE (internal instructions)</span>
                    </div>
                  )}
                  <div className="method-item total">
                    <span className="method-label">Token-based estimate:</span>
                    <span className="method-value">{tokenBasedEstimate}</span>
                    <span className="method-note">({billableTokens} tokens ÷ 1.3)</span>
                  </div>
                </div>
              </div>
              
              <div className="final-calculation">
                <div className="final-item">
                  <span className="final-label">Conservative billing uses:</span>
                  <span className="final-value">Higher of {totalActualWords} vs {tokenBasedEstimate} = <strong>{billedWords} words</strong></span>
                </div>
              </div>
            </div>
          ) : (
            // Legacy token breakdown
            <div className="token-grid">
              <div className="token-item">
                <span className="token-label">Input tokens:</span>
                <span className="token-value">{inputTokens}</span>
                <span className="token-note">({actualInputWords} words + processing instructions)</span>
              </div>
              <div className="token-item">
                <span className="token-label">Output tokens:</span>
                <span className="token-value">{outputTokens}</span>
                <span className="token-note">({actualOutputWords} words from AI)</span>
              </div>
              {systemTokens > 0 && (
                <div className="token-item free">
                  <span className="token-label">System tokens:</span>
                  <span className="token-value">{systemTokens}</span>
                  <span className="token-note">✅ FREE (internal AI instructions)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Why This System */}
        <div className="why-section">
          <h3>� Why This Billing System?</h3>
          <div className="reason-list">
            {isEnhancedBilling ? (
              <>
                <div className="reason">
                  <strong>Word-count primary:</strong> Easy to understand and verify - you see exactly what you're paying for in terms of actual content words.
                </div>
                <div className="reason">
                  <strong>Token fallback:</strong> Ensures you're never under-charged for complex processing that requires more AI resources than expected.
                </div>
                <div className="reason">
                  <strong>Conservative billing:</strong> We use the higher of word-count vs token-estimate to ensure fair pricing.
                </div>
              </>
            ) : (
              <>
                <div className="reason">
                  <strong>Processing overhead:</strong> Your {actualInputWords} words become {inputTokens} tokens because the AI needs extra tokens for understanding context, following instructions (tone, style), and internal processing.
                </div>
                <div className="reason">
                  <strong>Token vs Word difference:</strong> Tokens are smaller units than words. Common words might be 1 token, complex words might be 2-3 tokens, and punctuation/spaces count as tokens.
                </div>
              </>
            )}
          </div>
        </div>

        {/* The Good News */}
        <div className="good-news-section">
          <h3>✨ What's Great About This System</h3>
          <ul>
            {isEnhancedBilling ? (
              <>
                <li><strong>Transparent:</strong> Word-based billing is easy to understand and verify</li>
                <li><strong>Fair:</strong> You're charged for actual content, not just AI processing overhead</li>
                <li><strong>Conservative:</strong> We use the higher estimate to ensure you're never undercharged</li>
                <li>System processing ({systemTokens} tokens) is <strong>FREE</strong></li>
                <li>Multiple billing methods ensure <strong>accuracy and fairness</strong></li>
              </>
            ) : (
              <>
                <li>System processing ({systemTokens || 0} tokens) is <strong>FREE</strong></li>
                <li>You only pay for input + output tokens</li>
                <li>The conversion to "word equivalent" makes billing predictable</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Dialog>
  );
};

export default UsageBreakdownPopup;
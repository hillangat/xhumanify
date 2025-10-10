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
  const totalActualWords = inputWords + outputWords;
  const billableTokens = usageInfo.inputTokens + usageInfo.outputTokens;
  const chargedWords = Math.ceil(billableTokens / 1.3);

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
          <h3>📊 What You See vs What You Pay For</h3>
          <div className="comparison-grid">
            <div className="actual-content">
              <h4>Your Actual Content</h4>
              <div className="content-stats">
                <div>📝 Input: <strong>{inputWords} words</strong></div>
                <div>🤖 Output: <strong>{outputWords} words</strong></div>
                <div className="total">📄 Total: <strong>{totalActualWords} words</strong></div>
              </div>
            </div>
            <div className="charged-content">
              <h4>What You're Charged For</h4>
              <div className="charged-amount">
                <strong>{usageInfo.estimatedWords} word equivalents</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Why the Difference */}
        <div className="explanation-section">
          <h3>🤔 Why the Difference?</h3>
          <p>
            The system charges based on <strong>AI tokens</strong>, not actual word count. 
            Here's what happens behind the scenes:
          </p>
        </div>

        {/* Token Breakdown */}
        <div className="token-section">
          <h3>⚡ Token Usage Breakdown</h3>
          <div className="token-grid">
            <div className="token-item">
              <span className="token-label">Input tokens:</span>
              <span className="token-value">{usageInfo.inputTokens}</span>
              <span className="token-note">({inputWords} words + processing instructions)</span>
            </div>
            <div className="token-item">
              <span className="token-label">Output tokens:</span>
              <span className="token-value">{usageInfo.outputTokens}</span>
              <span className="token-note">({outputWords} words from AI)</span>
            </div>
            {usageInfo.systemPromptTokens && (
              <div className="token-item free">
                <span className="token-label">System tokens:</span>
                <span className="token-value">{usageInfo.systemPromptTokens}</span>
                <span className="token-note">✅ FREE (internal AI instructions)</span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Calculation */}
        <div className="calculation-section">
          <h3>💰 Billing Calculation</h3>
          <div className="calculation-steps">
            <div className="step">
              <div className="step-label">1. Billable tokens:</div>
              <div className="step-value">{usageInfo.inputTokens} + {usageInfo.outputTokens} = {billableTokens} tokens</div>
            </div>
            <div className="step">
              <div className="step-label">2. Convert to words:</div>
              <div className="step-value">{billableTokens} ÷ 1.3 = {chargedWords} word equivalents</div>
            </div>
            <div className="step final">
              <div className="step-label">3. You're charged for:</div>
              <div className="step-value"><strong>{usageInfo.estimatedWords} words</strong></div>
            </div>
          </div>
        </div>

        {/* Why More Tokens */}
        <div className="why-section">
          <h3>📈 Why More Tokens Than Words?</h3>
          <div className="reason-list">
            <div className="reason">
              <strong>Processing overhead:</strong> Your {inputWords} words become {usageInfo.inputTokens} tokens because the AI needs extra tokens for understanding context, following instructions (tone, style), and internal processing.
            </div>
            <div className="reason">
              <strong>Token vs Word difference:</strong> Tokens are smaller units than words. Common words might be 1 token, complex words might be 2-3 tokens, and punctuation/spaces count as tokens.
            </div>
          </div>
        </div>

        {/* The Good News */}
        <div className="good-news-section">
          <h3>✨ The Good News</h3>
          <ul>
            <li>System processing ({usageInfo.systemPromptTokens || 0} tokens) is <strong>FREE</strong></li>
            <li>You only pay for input + output tokens</li>
            <li>The conversion to "word equivalent" makes billing predictable</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
};

export default UsageBreakdownPopup;
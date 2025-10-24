import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import './UsageBreakdownPopup.scss';

interface UsageBreakdownPopupProps {
  visible: boolean;
  onHide: () => void;
  usageInfo: any;
}

const UsageBreakdownPopup: React.FC<UsageBreakdownPopupProps> = ({
  visible,
  onHide,
  usageInfo
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
        footer={
          <Button label="Close" onClick={onHide} icon="pi pi-times" />
        }
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--orange-500)', marginBottom: '1rem' }}></i>
          <h3>Legacy Billing Detected</h3>
          <p>This content was processed with our previous billing system. All new requests now use our transparent word-based billing for better clarity and fairness.</p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      header="New Billing System - Complete Transparency"
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
      style={{ width: '90vw', maxWidth: '700px' }}
    >
      <div className="usage-explanation">
        {/* Clear Summary */}
        <div className="summary-section">
          <h3>📊 New Billing System - Word-Based Transparency</h3>
          <div className="comparison-grid">
            <div className="actual-content">
              <h4>📝 Your Content</h4>
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
              <h4>💰 You're Charged</h4>
              <div className="charged-amount">
                <strong>{billedWords} words</strong>
              </div>
              <div className="billing-method">
                Method: {billingMethod.replace(/-/g, ' ')}
              </div>
            </div>
          </div>
          {billingNote && (
            <div className="billing-note">
              <i className="pi pi-info-circle"></i>
              {billingNote}
            </div>
          )}
        </div>

        {/* How The New System Works */}
        <div className="explanation-section">
          <h3>🎯 How Our New Billing System Works</h3>
          <p>
            We've redesigned our billing to be <strong>transparent and fair</strong>. 
            You're charged based on the actual words in your content, with AI processing 
            details available for complete transparency.
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="breakdown-section">
          <h3>📋 Complete Transparency Breakdown</h3>
          
          <div className="breakdown-grid">
            <div className="breakdown-card primary">
              <h4>📝 Word Count (Primary Billing)</h4>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span className="label">Your input:</span>
                  <span className="value">{actualInputWords} words</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">AI output:</span>
                  <span className="value">{actualOutputWords} words</span>
                </div>
                <div className="breakdown-item total">
                  <span className="label">Total content:</span>
                  <span className="value">{totalActualWords} words</span>
                </div>
              </div>
            </div>

            <div className="breakdown-card secondary">
              <h4>⚡ AI Processing (For Transparency)</h4>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span className="label">Input processing:</span>
                  <span className="value">{inputTokens} tokens</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Output generation:</span>
                  <span className="value">{outputTokens} tokens</span>
                </div>
                {systemTokens > 0 && (
                  <div className="breakdown-item free">
                    <span className="label">System overhead:</span>
                    <span className="value">{systemTokens} tokens ✅ FREE</span>
                  </div>
                )}
              </div>
            </div>

            <div className="breakdown-card result">
              <h4>💰 Final Billing</h4>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span className="label">Billing method:</span>
                  <span className="value">Word-based primary</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Conservative calculation:</span>
                  <span className="value">Fair & transparent</span>
                </div>
                <div className="breakdown-item final">
                  <span className="label">You pay for:</span>
                  <span className="value"><strong>{billedWords} words</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why This System */}
        <div className="benefits-section">
          <h3>✨ Why Our New System is Better</h3>
          <div className="benefits-grid">
            <div className="benefit">
              <i className="pi pi-eye benefit-icon"></i>
              <h4>Transparent</h4>
              <p>See exactly what you're paying for - actual words in your content</p>
            </div>
            <div className="benefit">
              <i className="pi pi-check-circle benefit-icon"></i>
              <h4>Fair</h4>
              <p>Pay for content, not AI processing overhead</p>
            </div>
            <div className="benefit">
              <i className="pi pi-calculator benefit-icon"></i>
              <h4>Predictable</h4>
              <p>Easy to calculate and verify your usage</p>
            </div>
            <div className="benefit">
              <i className="pi pi-shield benefit-icon"></i>
              <h4>Conservative</h4>
              <p>We use methods that ensure you're never overcharged</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default UsageBreakdownPopup;
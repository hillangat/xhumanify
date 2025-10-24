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
      header="Completely Transparency Billing System"
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
          <h3>� Billing Breakdown</h3>
          
          {/* Simple explanation of what they're being charged */}
          <div className="billing-summary">
            <div className="billing-amount">
              <span className="label">You're being charged for:</span>
              <span className="amount"><strong>{billedWords} words</strong></span>
            </div>
            
            <div className="content-breakdown">
              <div className="content-item">
                <span className="content-label">Your text:</span>
                <span className="content-value">{actualInputWords} words</span>
              </div>
              <div className="content-item">
                <span className="content-label">AI response:</span>
                <span className="content-value">{actualOutputWords} words</span>
              </div>
              <div className="content-item subtotal">
                <span className="content-label">Content total:</span>
                <span className="content-value">{totalActualWords} words</span>
              </div>
            </div>
            
            {billedWords > totalActualWords && (
              <div className="processing-explanation">
                <div className="processing-header">
                  <i className="pi pi-cog"></i>
                  <span>Why {billedWords - totalActualWords} additional words?</span>
                </div>
                <div className="processing-details">
                  <p>AI processing requires additional computational "words" beyond your visible content:</p>
                  <ul>
                    <li><strong>Context analysis:</strong> Understanding your text's meaning and tone</li>
                    <li><strong>Style instructions:</strong> Following your humanization preferences</li>
                    <li><strong>Quality assurance:</strong> Ensuring natural, human-like output</li>
                  </ul>
                  <p className="processing-note">
                    <strong>Total processing cost: {billedWords} words</strong>
                    <br />
                    <small>This includes your {totalActualWords} content words + {billedWords - totalActualWords} processing words</small>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {billingNote && (
            <div className="billing-note">
              <i className="pi pi-info-circle"></i>
              {billingNote}
            </div>
          )}
        </div>

        {/* Why This System */}
        <div className="benefits-section">
          <h3>✨ Fair & Transparent Billing</h3>
          <div className="benefits-grid">
            <div className="benefit">
              <i className="pi pi-eye benefit-icon"></i>
              <h4>Transparent</h4>
              <p>See exactly what you pay for - content + processing</p>
            </div>
            <div className="benefit">
              <i className="pi pi-check-circle benefit-icon"></i>
              <h4>Fair</h4>
              <p>Pay based on actual AI work required</p>
            </div>
            <div className="benefit">
              <i className="pi pi-shield benefit-icon"></i>
              <h4>Honest</h4>
              <p>No hidden fees - processing costs included upfront</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default UsageBreakdownPopup;
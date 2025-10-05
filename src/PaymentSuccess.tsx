import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useSubscription } from './contexts/SubscriptionContext';
import './PaymentSuccess.scss';
import { FaGooglePlay } from 'react-icons/fa';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Multiple refresh attempts with delays to ensure webhook processing is complete
        console.log('Starting payment verification for session:', sessionId);
        
        // First refresh immediately
        await refreshSubscription();
        
        // Wait 2 seconds and refresh again (webhooks can take time)
        setTimeout(async () => {
          console.log('Second refresh attempt...');
          await refreshSubscription();
        }, 2000);
        
        // Wait 5 seconds and refresh one more time
        setTimeout(async () => {
          console.log('Third refresh attempt...');
          await refreshSubscription();
        }, 5000);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment. Please contact support.');
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, refreshSubscription]);

  const handleRefreshSubscription = async () => {
    setIsLoading(true);
    try {
      console.log('Manual refresh requested...');
      await refreshSubscription();
      setIsLoading(false);
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  const handleViewBilling = () => {
    navigate('/upgrade');
  };

  if (isLoading) {
    return (
      <div className="payment-success-container">
        <Card className="payment-success-card">
          <div className="loading-content">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <h3>Verifying your payment...</h3>
            <p>Please wait while we confirm your subscription.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <Card className="payment-success-card">
          <div className="error-content">
            <i className="pi pi-exclamation-triangle error-icon"></i>
            <h3>Payment Verification Issue</h3>
            <div className="error-message">
              <p style={{ color: 'var(--red-600)', padding: '1rem', background: 'var(--red-50)', borderRadius: '8px', border: '1px solid var(--red-200)' }}>
                {error}
              </p>
            </div>
            <div className="action-buttons">
              <Button 
                label="Contact Support" 
                icon="pi pi-envelope" 
                severity="secondary" 
                outlined 
              />
              <Button 
                label="Go to Dashboard" 
                icon="pi pi-home" 
                onClick={handleContinue}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <Card className="payment-success-card">
        <div className="success-content">
          <div className="success-icon">
            <i className="pi pi-check-circle"></i>
          </div>
          
          <h2>🎉 Payment Successful!</h2>
          
          <p className="success-message">
            Thank you for your subscription! Your account has been upgraded and you now have access to all premium features.
          </p>

          <div className="session-info">
            <p><strong>Transaction ID:</strong></p>
            <p className="transaction-id">{sessionId}</p>
            <p><strong>Status:</strong> <span className="status-active">Active</span></p>
          </div>

          <div className="features-unlocked">
            <h4>🚀 What's unlocked:</h4>
            <ul>
              <li>✅ Increased word limits</li>
              <li>✅ Priority processing</li>
              <li>✅ Advanced humanization modes</li>
              <li>✅ Unlimited re-processing</li>
              <li>✅ Customer support</li>
            </ul>
          </div>

          <div className="action-buttons">
            <Button 
              label="Start Humanizing" 
              icon={<FaGooglePlay />}
              className="p-button-primary"
              onClick={handleContinue}
              size="large"
            />
            <Button 
              label="Manage Subscription" 
              icon="pi pi-cog" 
              severity="secondary" 
              outlined
              onClick={handleViewBilling}
            />
            <Button 
              label="Refresh Status" 
              icon="pi pi-refresh" 
              severity="info" 
              outlined
              onClick={handleRefreshSubscription}
              size="small"
              className="refresh-button"
            />
          </div>

          <div className="next-steps">
            <h4>📋 Next Steps:</h4>
            <ol>
              <li>Start using your increased word limits immediately</li>
              <li>Explore advanced humanization features</li>
              <li>Check your usage statistics in the dashboard</li>
              <li>Contact support if you need any help</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
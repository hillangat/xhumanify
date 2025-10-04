import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useSubscription } from './contexts/SubscriptionContext';
import { PRICING_PLANS, PlanType } from './utils/stripe';
import { useAuthenticator } from '@aws-amplify/ui-react';
import './PricingComponent.scss';

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  words: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  free?: boolean;
}

const PricingComponent: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { subscription, currentPlan, hasActiveSubscription } = useSubscription();
  const { user } = useAuthenticator();
  const toast = useRef<Toast>(null);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      words: '1,500 words',
      features: [
        '300 words per process',
        'All modes and settings',
        'No weird or random words',
        'Customer support'
      ],
      buttonText: 'Get Started Free',
      free: true
    },
    {
      id: 'lite',
      name: 'Lite',
      monthlyPrice: 19,
      yearlyPrice: 14.25,
      words: '20,000 words / mo.',
      features: [
        'ALL modes and settings',
        '500 words per process',
        'Continuous improvements',
        'Undetectable by all AIs',
        'No weird or random words',
        'Customer support'
      ],
      buttonText: 'Choose Lite'
    },
    {
      id: 'standard',
      name: 'Standard',
      badge: 'Most Loved',
      monthlyPrice: 29,
      yearlyPrice: 21.75,
      words: '50,000 words / mo.',
      features: [
        'ALL modes and settings',
        'Re-paraphrasing is free',
        'Unlimited words per process',
        'Continuous improvements',
        'Undetectable by all AIs',
        'No weird or random words',
        'Customer support'
      ],
      buttonText: 'Choose Standard',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 79,
      yearlyPrice: 59.25,
      words: '150,000 words / mo.',
      features: [
        'ALL modes and settings',
        'Re-paraphrasing is free',
        'Unlimited words per process',
        'Continuous improvements',
        'Undetectable by all AIs',
        'No weird or random words',
        'Customer support',
        'API access'
      ],
      buttonText: 'Choose Pro'
    }
  ];

  const faqs = [
    {
      question: 'How can I be sure that the content is undetectable?',
      answer: 'Our advanced AI humanification technology has been tested against all major AI detection tools. We continuously update our algorithms to stay ahead of detection methods.'
    },
    {
      question: 'What refund policy do you have?',
      answer: 'Money back guarantee. If anything we produce is flagged as not human by AI detectors, we will refund the cost of humanification.'
    },
    {
      question: 'Do unused credits accumulate?',
      answer: 'No, unused word credits do not roll over to the next billing period. We recommend choosing a plan that matches your monthly usage.'
    },
    {
      question: 'What happens if I barely use words during a month?',
      answer: 'Your subscription remains active and you can use your full allocation anytime during the billing period. Consider our usage-based pricing for light usage.'
    },
    {
      question: 'What is the cancellation policy?',
      answer: 'You can cancel anytime. Your subscription will remain active until the end of your current billing period.'
    }
  ];

  const getCurrentPrice = (plan: PricingPlan) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavingsText = (plan: PricingPlan) => {
    if (plan.free || billingPeriod === 'monthly') return null;
    const savings = Math.round(((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100);
    return `Save ${savings}%`;
  };

  // Stripe functionality
  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Authentication Required',
        detail: 'Please sign in to subscribe to a plan.',
        life: 5000
      });
      return;
    }

    setLoadingPlan(planId);
    
    toast.current?.show({
      severity: 'info',
      summary: 'Processing',
      detail: 'Creating your checkout session...',
      life: 3000
    });
    
    try {
      // Map plan IDs to Stripe plan types
      const planMapping: Record<string, PlanType> = {
        'lite': 'lite',
        'standard': 'standard',
        'pro': 'pro'
      };
      
      const planType = planMapping[planId];
      if (!planType) {
        toast.current?.show({
          severity: 'error',
          summary: 'Invalid Plan',
          detail: 'The selected plan is not available.',
          life: 5000
        });
        return;
      }
      
      const plan = PRICING_PLANS[planType];
      const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
      
      // Use Amplify API endpoint
      const response = await fetch(`${import.meta.env.VITE_APP_URL || window.location.origin}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.userId,
          userEmail: user.signInDetails?.loginId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { url } = await response.json();
      
      if (url) {
        toast.current?.show({
          severity: 'success',
          summary: 'Redirecting',
          detail: 'Taking you to secure checkout...',
          life: 2000
        });
        // Small delay to show success message
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Checkout Failed',
        detail: 'Unable to create checkout session. Please try again or contact support.',
        life: 7000
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripeCustomerId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'No Subscription',
        detail: 'No active subscription found to manage.',
        life: 5000
      });
      return;
    }
    
    toast.current?.show({
      severity: 'info',
      summary: 'Loading',
      detail: 'Opening subscription management portal...',
      life: 3000
    });
    
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_URL || window.location.origin}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { url } = await response.json();
      
      if (url) {
        toast.current?.show({
          severity: 'success',
          summary: 'Redirecting',
          detail: 'Taking you to the subscription portal...',
          life: 2000
        });
        // Small delay to show success message
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Portal Access Failed',
        detail: 'Unable to access subscription portal. Please try again or contact support.',
        life: 7000
      });
    }
  };

  const getButtonText = (planId: string) => {
    const planMapping: Record<string, PlanType> = {
      'lite': 'lite',
      'standard': 'standard', 
      'pro': 'pro'
    };
    
    const planType = planMapping[planId];
    if (currentPlan === planType) {
      return 'Current Plan';
    }
    if (hasActiveSubscription && currentPlan !== planType) {
      return 'Upgrade';
    }
    return plans.find(p => p.id === planId)?.buttonText || 'Get Started';
  };

  const isButtonDisabled = (planId: string) => {
    const planMapping: Record<string, PlanType> = {
      'lite': 'lite',
      'standard': 'standard',
      'pro': 'pro'
    };
    
    const planType = planMapping[planId];
    return currentPlan === planType || loadingPlan === planId;
  };

  return (
    <div className="pricing-component">
      <div className="pricing-header">
        <h1>Get the most undetectable AI paraphrasing tool</h1>
        <p className="guarantee-text">
          <i className="pi pi-shield-check"></i>
          Money back guarantee. If anything we produce is flagged as not human, we will refund the cost of humanization.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="billing-toggle">
        <div className="toggle-container">
          <button 
            className={`toggle-option ${billingPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-option ${billingPeriod === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('yearly')}
          >
            Yearly
            <Badge value="25% off" severity="success" className="yearly-badge" />
          </button>
        </div>
      </div>

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Card className="current-subscription" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <div className="subscription-info">
            <h3>Current Subscription: {currentPlan && PRICING_PLANS[currentPlan]?.name}</h3>
            <p>Usage: {subscription?.usageCount} / {subscription?.usageLimit === -1 ? 'Unlimited' : subscription?.usageLimit}</p>
            <Button 
              label="Manage Subscription"
              icon="pi pi-cog"
              className="p-button-outlined"
              onClick={handleManageSubscription}
            />
          </div>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="pricing-grid">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.free ? 'free' : ''}`}
          >
            {plan.badge && (
              <div className="plan-badge">
                <Badge value={plan.badge} severity="info" />
              </div>
            )}
            
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                {plan.free ? (
                  <span className="price-large">Free</span>
                ) : (
                  <>
                    <span className="price-large">
                      ${getCurrentPrice(plan)}
                    </span>
                    <span className="price-period">/ mo.</span>
                    {getSavingsText(plan) && (
                      <div className="savings-text">{getSavingsText(plan)}</div>
                    )}
                  </>
                )}
              </div>
              <div className="plan-words">{plan.words}</div>
            </div>

            <Divider />

            <div className="plan-features">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <i className="pi pi-check feature-check"></i>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="plan-footer">
              <Button 
                label={loadingPlan === plan.id ? '' : getButtonText(plan.id)}
                icon={loadingPlan === plan.id ? <ProgressSpinner style={{ width: '20px', height: '20px' }} /> : undefined}
                className={`plan-button ${plan.popular ? 'p-button-primary' : 'p-button-outlined'}`}
                size="large"
                disabled={plan.free ? false : isButtonDisabled(plan.id)}
                onClick={() => plan.free ? undefined : handleSubscribe(plan.id)}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <Accordion multiple>
          {faqs.map((faq, index) => (
            <AccordionTab key={index} header={faq.question}>
              <p>{faq.answer}</p>
            </AccordionTab>
          ))}
        </Accordion>
      </div>
      
      {/* Toast Notifications */}
      <Toast ref={toast} position="top-right" />
    </div>
  );
};

export default PricingComponent;
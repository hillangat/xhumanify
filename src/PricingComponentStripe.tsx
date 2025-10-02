import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useSubscription } from './contexts/SubscriptionContext';
import { PRICING_PLANS, formatPrice, PlanType } from './utils/stripe';
import { useAuthenticator } from '@aws-amplify/ui-react';
import './PricingComponent.scss';

const PricingComponent: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { subscription, currentPlan, hasActiveSubscription } = useSubscription();
  const { user } = useAuthenticator();

  const handleSubscribe = async (planType: PlanType) => {
    if (!user) {
      // Redirect to login or show auth modal
      console.error('User must be authenticated to subscribe');
      return;
    }

    setLoadingPlan(planType);
    
    try {
      const plan = PRICING_PLANS[planType];
      
      // Call your Amplify function to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.userId,
          userEmail: user.signInDetails?.loginId
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripeCustomerId) return;
    
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  const getButtonText = (planType: PlanType) => {
    if (currentPlan === planType) {
      return 'Current Plan';
    }
    if (hasActiveSubscription && currentPlan !== planType) {
      return 'Upgrade';
    }
    return 'Get Started';
  };

  const getButtonVariant = (planType: PlanType) => {
    if (currentPlan === planType) {
      return 'outlined';
    }
    return undefined;
  };

  const isButtonDisabled = (planType: PlanType) => {
    return currentPlan === planType || loadingPlan === planType;
  };

  return (
    <main className="pricing-component">
      <div className="pricing-header">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that's right for you</p>
        
        {/* Billing Toggle */}
        <div className="billing-toggle">
          <Button
            label="Monthly"
            className={billingPeriod === 'monthly' ? 'p-button-filled' : 'p-button-outlined'}
            onClick={() => setBillingPeriod('monthly')}
          />
          <Button
            label="Yearly"
            className={billingPeriod === 'yearly' ? 'p-button-filled' : 'p-button-outlined'}
            onClick={() => setBillingPeriod('yearly')}
          />
          <Badge value="Save 20%" severity="success" className="yearly-badge" />
        </div>
      </div>

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Card className="current-subscription">
          <div className="subscription-info">
            <h3>Current Subscription: {PRICING_PLANS[currentPlan!].name}</h3>
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

      {/* Pricing Plans */}
      <div className="pricing-grid">
        {/* Free Tier */}
        <Card className="pricing-card free-card">
          <div className="card-header">
            <h2>Free</h2>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">0</span>
              <span className="period">/month</span>
            </div>
            <p className="description">Get started with basic humanification</p>
          </div>
          
          <ul className="features">
            <li>✓ 5 humanifications per month</li>
            <li>✓ Basic tone options</li>
            <li>✓ Standard processing</li>
            <li>✓ Community support</li>
          </ul>
          
          <Button
            label={!hasActiveSubscription ? "Current Plan" : "Downgrade"}
            className="subscribe-btn"
            outlined={!hasActiveSubscription}
            disabled={!hasActiveSubscription}
          />
        </Card>

        {/* Paid Plans */}
        {Object.entries(PRICING_PLANS).map(([planKey, plan]) => {
          const planType = planKey as PlanType;
          const yearlyPrice = Math.round(plan.price * 0.8 * 12); // 20% discount
          const displayPrice = billingPeriod === 'monthly' ? plan.price : yearlyPrice / 12;
          
          return (
            <Card 
              key={planKey} 
              className={`pricing-card ${plan.popular ? 'popular-card' : ''}`}
            >
              {plan.popular && <Badge value="Most Popular" className="popular-badge" />}
              
              <div className="card-header">
                <h2>{plan.name}</h2>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">{formatPrice(displayPrice).replace('$', '')}</span>
                  <span className="period">/{billingPeriod === 'monthly' ? 'month' : 'month'}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="yearly-savings">
                    Billed ${formatPrice(yearlyPrice)} yearly
                  </p>
                )}
                <p className="description">
                  {plan.usageLimit === -1 ? 'Unlimited' : plan.usageLimit} humanifications per month
                </p>
              </div>
              
              <ul className="features">
                {plan.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              
              <Button
                label={loadingPlan === planType ? '' : getButtonText(planType)}
                icon={loadingPlan === planType ? <ProgressSpinner style={{ width: '20px', height: '20px' }} /> : undefined}
                className={`subscribe-btn ${plan.popular ? 'popular-btn' : ''}`}
                disabled={isButtonDisabled(planType)}
                outlined={getButtonVariant(planType) === 'outlined'}
                onClick={() => handleSubscribe(planType)}
              />
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <Accordion multiple activeIndex={[0]}>
          <AccordionTab header="How does billing work?">
            <p>
              You'll be charged monthly or yearly based on your selected plan. 
              All plans include a usage limit that resets each billing cycle.
            </p>
          </AccordionTab>
          
          <AccordionTab header="Can I change or cancel my plan?">
            <p>
              Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
              Changes take effect at the next billing cycle.
            </p>
          </AccordionTab>
          
          <AccordionTab header="What happens if I exceed my usage limit?">
            <p>
              If you reach your monthly limit, you'll need to upgrade your plan or wait 
              until the next billing cycle. We'll notify you as you approach your limit.
            </p>
          </AccordionTab>
          
          <AccordionTab header="Is there a free trial?">
            <p>
              Yes! All new users get 5 free humanifications to try our service. 
              No credit card required.
            </p>
          </AccordionTab>
          
          <AccordionTab header="Do you offer enterprise pricing?">
            <p>
              Yes! Our Enterprise plan includes custom integrations, dedicated support, 
              and volume discounts. Contact us for custom pricing.
            </p>
          </AccordionTab>
        </Accordion>
      </div>
    </main>
  );
};

export default PricingComponent;
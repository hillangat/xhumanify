import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Accordion, AccordionTab } from 'primereact/accordion';
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
        'Customer support'
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
                label={plan.buttonText}
                className={`plan-button ${plan.popular ? 'p-button-primary' : 'p-button-outlined'}`}
                size="large"
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
    </div>
  );
};

export default PricingComponent;
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price / 100);
};

export const PRICING_PLANS = {
  basic: {
    name: 'Basic',
    price: 999, // $9.99 in cents
    priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID!,
    features: [
      '50 humanifications per month',
      'Basic tone options',
      'Email support',
      'Standard processing speed'
    ],
    usageLimit: 50,
    popular: false
  },
  pro: {
    name: 'Pro',
    price: 2999, // $29.99 in cents
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID!,
    features: [
      '500 humanifications per month',
      'All tone options',
      'Priority support',
      'Faster processing',
      'Export to multiple formats',
      'Analytics dashboard'
    ],
    usageLimit: 500,
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 9999, // $99.99 in cents
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID!,
    features: [
      'Unlimited humanifications',
      'Custom tone creation',
      'Dedicated support',
      'API access',
      'White-label options',
      'Custom integrations',
      'SLA guarantee'
    ],
    usageLimit: -1, // Unlimited
    popular: false
  }
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
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
  lite: {
    name: 'Lite',
    monthlyPrice: 1900, // $19.00 in cents
    yearlyPrice: 17100, // $171.00 in cents (25% discount)
    monthlyPriceId: 'price_1SEAui47Knk6vC3kvBiS86dC',
    yearlyPriceId: 'price_1SEBk147Knk6vC3kVV288Vmg',
    features: [
      '20,000 words per month',
      '500 words per process',
      'All modes and settings',
      'Customer support'
    ],
    usageLimit: 20000,
    popular: false
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 2900, // $29.00 in cents
    yearlyPrice: 26100, // $261.00 in cents (25% discount)
    monthlyPriceId: 'price_1SECNL47Knk6vC3kGQMZEwCH',
    yearlyPriceId: 'price_1SECNL47Knk6vC3kao99ug2W',
    features: [
      '50,000 words per month',
      'Unlimited words per process',
      'Re-paraphrasing is free',
      'All modes and settings',
      'Priority support'
    ],
    usageLimit: 50000,
    popular: true
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 7900, // $79.00 in cents
    yearlyPrice: 71100, // $711.00 in cents (25% discount)
    monthlyPriceId: 'price_1SECQb47Knk6vC3kkvNYxIii',
    yearlyPriceId: 'price_1SECRf47Knk6vC3kaZmpEomz',
    features: [
      '150,000 words per month',
      'Unlimited words per process',
      'Re-paraphrasing is free',
      'All modes and settings',
      'Dedicated support',
      'API access'
    ],
    usageLimit: 150000,
    popular: false
  }
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
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
    monthlyPriceId: import.meta.env.VITE_STRIPE_LITE_MONTHLY_PRICE_ID!,
    yearlyPriceId: import.meta.env.VITE_STRIPE_LITE_YEARLY_PRICE_ID!,
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
    monthlyPriceId: import.meta.env.VITE_STRIPE_STANDARD_MONTHLY_PRICE_ID!,
    yearlyPriceId: import.meta.env.VITE_STRIPE_STANDARD_YEARLY_PRICE_ID!,
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
    monthlyPriceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearlyPriceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID!,
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
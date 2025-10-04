import { loadStripe, Stripe } from '@stripe/stripe-js';
import { PRICING_PLANS, formatPrice } from '../config/plans';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Re-export for backward compatibility
export { formatPrice, PRICING_PLANS };
export type PlanType = keyof typeof PRICING_PLANS;
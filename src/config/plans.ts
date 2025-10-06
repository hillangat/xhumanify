// Unified plan configuration - single source of truth
import { SHARED_PLAN_CONFIG } from '../../amplify/shared/planConfig';

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    tier: 'free' as const,
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyPriceId: null,
    yearlyPriceId: null,
    limits: SHARED_PLAN_CONFIG.free.limits,
    features: [
      '1,500 words / mo.',
      'ALL modes and settings',
      '300 words per process',
      'No weird or random words',
      'Customer support'
    ],
    popular: false
  },
  lite: {
    name: 'Lite',
    tier: 'lite' as const,
    monthlyPrice: 1900, // $19.00 in cents
    yearlyPrice: 17100, // $171.00 in cents (25% discount)
    monthlyPriceId: 'price_1SEAui47Knk6vC3kvBiS86dC',
    yearlyPriceId: 'price_1SEBk147Knk6vC3kVV288Vmg',
    limits: SHARED_PLAN_CONFIG.lite.limits,
    features: [
      '20,000 words / mo.',
      'ALL modes and settings',
      '500 words per process',
      'Continuous improvements',
      'Undetectable by all AIs',
      'No weird or random words',
      'Customer support'
    ],
    popular: false
  },
  standard: {
    name: 'Standard',
    tier: 'standard' as const,
    monthlyPrice: 2900, // $29.00 in cents
    yearlyPrice: 26100, // $261.00 in cents (25% discount)
    monthlyPriceId: 'price_1SECNL47Knk6vC3kGQMZEwCH',
    yearlyPriceId: 'price_1SECNL47Knk6vC3kao99ug2W',
    limits: SHARED_PLAN_CONFIG.standard.limits,
    features: [
      '50,000 words / mo.',
      'ALL modes and settings',
      'Re-paraphrasing is free',
      'Unlimited words per process',
      'Continuous improvements',
      'Undetectable by all AIs',
      'No weird or random words',
      'Customer support'
    ],
    popular: true
  },
  pro: {
    name: 'Pro',
    tier: 'pro' as const,
    monthlyPrice: 7900, // $79.00 in cents
    yearlyPrice: 71100, // $711.00 in cents (25% discount)
    monthlyPriceId: 'price_1SECQb47Knk6vC3kkvNYxIii',
    yearlyPriceId: 'price_1SECRf47Knk6vC3kaZmpEomz',
    limits: SHARED_PLAN_CONFIG.pro.limits,
    features: [
      '150,000 words / mo.',
      'ALL modes and settings',
      'Re-paraphrasing is free',
      'Unlimited words per process',
      'Continuous improvements',
      'Undetectable by all AIs',
      'No weird or random words',
      'Customer support',
      'API access'
    ],
    popular: false
  }
} as const;

export type PlanTier = keyof typeof PLAN_CONFIG;
export type PlanConfig = typeof PLAN_CONFIG[PlanTier];

// Helper function to count words in text
export const countWords = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Helper function to get plan configuration by tier
export const getPlanConfig = (tier: PlanTier) => {
  return PLAN_CONFIG[tier];
};

// Helper function to get plan limits by tier
export const getPlanLimits = (tier: PlanTier) => {
  return PLAN_CONFIG[tier].limits;
};

// Helper function to determine user's tier based on subscription
export const getUserTier = (hasActiveSubscription: boolean, planName?: string): PlanTier => {
  if (!hasActiveSubscription) return 'free';
  
  switch (planName?.toLowerCase()) {
    case 'lite':
      return 'lite';
    case 'standard':
      return 'standard';
    case 'pro':
      return 'pro';
    default:
      return 'free';
  }
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price / 100);
};

// Extract only pricing plans for Stripe (backward compatibility)
export const PRICING_PLANS = {
  lite: {
    name: PLAN_CONFIG.lite.name,
    monthlyPrice: PLAN_CONFIG.lite.monthlyPrice,
    yearlyPrice: PLAN_CONFIG.lite.yearlyPrice,
    monthlyPriceId: PLAN_CONFIG.lite.monthlyPriceId!,
    yearlyPriceId: PLAN_CONFIG.lite.yearlyPriceId!,
    features: PLAN_CONFIG.lite.features,
    usageLimit: PLAN_CONFIG.lite.limits.monthlyWordLimit,
    popular: PLAN_CONFIG.lite.popular
  },
  standard: {
    name: PLAN_CONFIG.standard.name,
    monthlyPrice: PLAN_CONFIG.standard.monthlyPrice,
    yearlyPrice: PLAN_CONFIG.standard.yearlyPrice,
    monthlyPriceId: PLAN_CONFIG.standard.monthlyPriceId,
    yearlyPriceId: PLAN_CONFIG.standard.yearlyPriceId,
    features: PLAN_CONFIG.standard.features,
    usageLimit: PLAN_CONFIG.standard.limits.monthlyWordLimit,
    popular: PLAN_CONFIG.standard.popular
  },
  pro: {
    name: PLAN_CONFIG.pro.name,
    monthlyPrice: PLAN_CONFIG.pro.monthlyPrice,
    yearlyPrice: PLAN_CONFIG.pro.yearlyPrice,
    monthlyPriceId: PLAN_CONFIG.pro.monthlyPriceId,
    yearlyPriceId: PLAN_CONFIG.pro.yearlyPriceId,
    features: PLAN_CONFIG.pro.features,
    usageLimit: PLAN_CONFIG.pro.limits.monthlyWordLimit,
    popular: PLAN_CONFIG.pro.popular
  }
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
// Shared plan configuration for both frontend and backend
// This file can be imported by both Amplify functions and frontend code

export const SHARED_PLAN_CONFIG = {
  free: {
    name: 'Free',
    limits: {
      monthlyWordLimit: 1500,
      wordsPerRequest: 300,
      dailyRequestLimit: 5
    }
  },
  lite: {
    name: 'Lite',
    limits: {
      monthlyWordLimit: 20000,
      wordsPerRequest: 500,
      dailyRequestLimit: 999999
    }
  },
  standard: {
    name: 'Standard',
    limits: {
      monthlyWordLimit: 50000,
      wordsPerRequest: 999999,
      dailyRequestLimit: 999999
    }
  },
  pro: {
    name: 'Pro',
    limits: {
      monthlyWordLimit: 150000,
      wordsPerRequest: 999999,
      dailyRequestLimit: 999999
    }
  }
} as const;

export type SharedPlanTier = keyof typeof SHARED_PLAN_CONFIG;

// Helper function to get plan limits
export const getSharedPlanLimits = (tier: SharedPlanTier) => {
  return SHARED_PLAN_CONFIG[tier].limits;
};

// Legacy format for webhook compatibility
export const PLAN_LIMITS: Record<string, { monthlyWordLimit: number; usageLimit: number }> = {
  'lite': { 
    monthlyWordLimit: SHARED_PLAN_CONFIG.lite.limits.monthlyWordLimit, 
    usageLimit: SHARED_PLAN_CONFIG.lite.limits.monthlyWordLimit 
  },
  'standard': { 
    monthlyWordLimit: SHARED_PLAN_CONFIG.standard.limits.monthlyWordLimit, 
    usageLimit: SHARED_PLAN_CONFIG.standard.limits.monthlyWordLimit 
  },
  'pro': { 
    monthlyWordLimit: SHARED_PLAN_CONFIG.pro.limits.monthlyWordLimit, 
    usageLimit: SHARED_PLAN_CONFIG.pro.limits.monthlyWordLimit 
  },
  'free': { 
    monthlyWordLimit: SHARED_PLAN_CONFIG.free.limits.monthlyWordLimit, 
    usageLimit: SHARED_PLAN_CONFIG.free.limits.monthlyWordLimit 
  }
};
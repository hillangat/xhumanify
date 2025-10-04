// Re-export everything from the consolidated plans config
export { 
  PLAN_CONFIG as USAGE_LIMITS,
  countWords, 
  getUserTier, 
  getPlanLimits as getUsageLimits,
  type PlanTier as UsageTier 
} from '../config/plans';
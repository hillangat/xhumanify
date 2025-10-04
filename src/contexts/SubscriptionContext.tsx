import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { PlanType } from '../utils/stripe';
import { countWords, getUserTier, getPlanLimits, type PlanTier as UsageTier } from '../config/plans';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  loading: boolean;
  hasActiveSubscription: boolean;
  currentPlan: PlanType | null;
  usageCount: number;
  usageLimit: number;
  canUseService: boolean;
  currentTier: UsageTier;
  refreshSubscription: () => Promise<void>;
  trackUsage: (inputText: string, outputText: string) => Promise<void>;
  checkUsageLimit: (inputText: string) => boolean;
}

interface UserSubscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  planName?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  usageCount: number;
  usageLimit: number;
  createdAt?: string;
  updatedAt?: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const client = generateClient<Schema>();

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.UserSubscription.list({
        limit: 1
      });
      
      if (data && data.length > 0) {
        setSubscription(data[0] as UserSubscription);
      } else {
        // No subscription found - user is on free tier
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const trackUsage = async (inputText: string, outputText: string) => {
    const inputWords = countWords(inputText);
    const outputWords = countWords(outputText);
    const totalWords = inputWords + outputWords;
    
    try {
      // Create usage tracking record
      await client.models.UsageTracking.create({
        operation: 'humanify',
        tokensUsed: totalWords,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      // Update subscription usage count if subscription exists
      if (subscription) {
        await client.models.UserSubscription.update({
          id: subscription.id,
          usageCount: subscription.usageCount + totalWords
        });
      }
      
      // Refresh local state
      await loadSubscription();
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const checkUsageLimit = (inputText: string): boolean => {
    const inputWords = countWords(inputText);
    const currentTier = getUserTier(hasActiveSubscription, subscription?.planName);
    const limits = getPlanLimits(currentTier);
    
    // Check if adding this request would exceed monthly limit
    const newTotal = usageCount + inputWords;
    
    if (newTotal > limits.monthlyWordLimit) {
      return false;
    }
    
    // Check per-request word limit
    if (inputWords > limits.wordsPerRequest) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  // Derived values
  const hasActiveSubscription = subscription?.status === 'active';
  
  const currentPlan: PlanType | null = subscription?.planName as PlanType || null;
  
  const currentTier = getUserTier(hasActiveSubscription, subscription?.planName);
  const limits = getPlanLimits(currentTier);
  
  const usageCount = subscription?.usageCount || 0;
  const usageLimit = limits.monthlyWordLimit;
  
  const canUseService = hasActiveSubscription 
    ? usageCount < usageLimit // Under limit for paid tiers
    : usageCount < limits.monthlyWordLimit; // Free tier limit

  const value: SubscriptionContextType = {
    subscription,
    loading,
    hasActiveSubscription,
    currentPlan,
    usageCount,
    usageLimit,
    canUseService,
    currentTier,
    refreshSubscription: loadSubscription,
    trackUsage,
    checkUsageLimit
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
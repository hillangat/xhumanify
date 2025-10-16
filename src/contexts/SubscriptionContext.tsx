import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
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
  trackUsageWithTokens: (inputText: string, outputText: string, usage: any) => Promise<void>;
  checkUsageLimit: (inputText: string) => boolean;
}

interface UserSubscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status?: 'active' | 'canceled' | 'pastdue' | 'incomplete' | 'trialing';
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
      
      // Get current user to filter by userId if needed
      let currentUser;
      try {
        currentUser = await getCurrentUser();
      } catch (authError) {
        console.log('User not authenticated');
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Load subscription with proper user filtering and active status
      // Get all user subscriptions and filter for active ones in memory
      let data: any[] = [];
      try {
        // Get all subscriptions for this user first
        const result = await client.models.UserSubscription.list({
          filter: {
            userId: {
              eq: currentUser.userId
            }
          },
          selectionSet: [
            'id',
            'userId',
            'stripeCustomerId',
            'stripeSubscriptionId',
            'stripePriceId',
            'status',
            'planName',
            'currentPeriodStart',
            'currentPeriodEnd',
            'cancelAtPeriodEnd',
            'usageCount',
            'usageLimit',
            'createdAt',
            'updatedAt'
          ]
        });
        
        // Filter for active subscriptions in memory
        data = result.data?.filter(sub => sub.status === 'active') || [];
        
      } catch (error) {
        console.error('Failed to load subscription:', error);
        data = [];
      }
      
      if (data && data.length > 0) {
        // Use the first (and should be only) subscription for this user
        const userSubscription = data[0];
        
        // Security check: ensure subscription belongs to current user
        if (userSubscription.userId === currentUser.userId) {
          setSubscription(userSubscription as UserSubscription);
        } else {
          console.error('Security violation: Subscription userId mismatch');
          setSubscription(null);
        }
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
      
      // Update or create subscription usage count
      if (subscription) {
        await client.models.UserSubscription.update({
          id: subscription.id,
          usageCount: subscription.usageCount + totalWords
        }, {
          selectionSet: [
            'id',
            'userId', 
            'usageCount',
            'usageLimit',
            'updatedAt'
          ]
        });
      } else {
        // Get current user for ownership
        const currentUser = await getCurrentUser();
        
        // Create a free tier subscription record for tracking
        await client.models.UserSubscription.create({
          userId: currentUser.userId,
          stripeCustomerId: 'free-tier-user',
          stripeSubscriptionId: undefined,
          stripePriceId: undefined,
          status: undefined, // No active subscription
          planName: 'free',
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
          usageCount: totalWords,
          usageLimit: 50, // Free tier limit
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Refresh local state
      await loadSubscription();
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const trackUsageWithTokens = async (inputText: string, outputText: string, usage: any) => {
    try {
      // Use billable tokens (excludes system prompt overhead)
      const billableTokens = usage.totalTokens || 0; // This is now billable tokens only
      const estimatedWords = usage.estimatedWords || countWords(inputText) + countWords(outputText);
      const systemPromptTokens = usage.systemPromptTokens || 0;
      
      // Log transparency info for user
      console.log('📊 Token Usage Breakdown:', {
        userInputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        billableTokens: billableTokens,
        systemPromptTokens: systemPromptTokens,
        estimatedWords: estimatedWords,
        note: 'You are only charged for billable tokens (user input + output)'
      });
      
      // Create usage tracking record with billable token data
      await client.models.UsageTracking.create({
        operation: 'humanify',
        tokensUsed: estimatedWords, // Store as word equivalent for consistency
        success: true,
        timestamp: new Date().toISOString()
      });
      
      // Update or create subscription usage count if subscription exists
      if (subscription) {
        await client.models.UserSubscription.update({
          id: subscription.id,
          usageCount: subscription.usageCount + estimatedWords
        }, {
          selectionSet: [
            'id',
            'userId',
            'usageCount', 
            'usageLimit',
            'updatedAt'
          ]
        });
      } else {
        // Get current user for ownership
        const currentUser = await getCurrentUser();
        
        // Create a free tier subscription record for tracking
        await client.models.UserSubscription.create({
          userId: currentUser.userId,
          stripeCustomerId: 'free-tier-user',
          stripeSubscriptionId: undefined,
          stripePriceId: undefined,
          status: undefined, // No active subscription
          planName: 'free',
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
          usageCount: estimatedWords,
          usageLimit: 50, // Free tier limit
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Log usage summary for monitoring
      console.log('📈 Usage Summary:', {
        billableTokens,
        estimatedWords,
        inputWords: countWords(inputText),
        outputWords: countWords(outputText),
        systemOverhead: systemPromptTokens,
        note: 'System overhead not charged to user'
      });
      
      // Refresh local state
      await loadSubscription();
    } catch (error) {
      console.error('Failed to track token usage:', error);
      // Fallback to old method
      await trackUsage(inputText, outputText);
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
    trackUsageWithTokens,
    checkUsageLimit
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
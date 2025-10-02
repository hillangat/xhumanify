import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { PlanType } from '../utils/stripe';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  loading: boolean;
  hasActiveSubscription: boolean;
  currentPlan: PlanType | null;
  usageCount: number;
  usageLimit: number;
  canUseService: boolean;
  refreshSubscription: () => Promise<void>;
  incrementUsage: () => Promise<void>;
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

  const incrementUsage = async () => {
    if (!subscription) return;
    
    try {
      // Create usage tracking record
      await client.models.UsageTracking.create({
        operation: 'humanify',
        tokensUsed: 1,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      // Update subscription usage count
      await client.models.UserSubscription.update({
        id: subscription.id,
        usageCount: subscription.usageCount + 1
      });
      
      // Refresh local state
      await loadSubscription();
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  // Derived values
  const hasActiveSubscription = subscription?.status === 'active';
  
  const currentPlan: PlanType | null = subscription?.planName as PlanType || null;
  
  const usageCount = subscription?.usageCount || 0;
  const usageLimit = subscription?.usageLimit || 5; // Free tier: 5 uses
  
  const canUseService = hasActiveSubscription 
    ? (usageLimit === -1 || usageCount < usageLimit) // Unlimited or under limit
    : usageCount < 5; // Free tier: 5 uses

  const value: SubscriptionContextType = {
    subscription,
    loading,
    hasActiveSubscription,
    currentPlan,
    usageCount,
    usageLimit,
    canUseService,
    refreshSubscription: loadSubscription,
    incrementUsage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
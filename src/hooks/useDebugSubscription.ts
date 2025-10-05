import { get } from 'aws-amplify/api';

export interface DebugSubscriptionInfo {
  timestamp: string;
  totalSubscriptions: number;
  subscriptions: Array<{
    id: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: string;
    planName?: string;
    usageCount: number;
    usageLimit: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  recentUsage: Array<{
    id: string;
    operation?: string;
    tokensUsed: number;
    success: boolean;
    timestamp?: string;
  }>;
}

export const useDebugSubscription = () => {
  const debugSubscription = async (): Promise<DebugSubscriptionInfo> => {
    try {
      const response = await get({
        apiName: 'myRestApi',
        path: '/stripe/debug-subscription'
      }).response;
      
      const data = await response.body.json();
      return data as unknown as DebugSubscriptionInfo;
    } catch (error) {
      console.error('Failed to get debug subscription info:', error);
      throw error;
    }
  };

  return { debugSubscription };
};
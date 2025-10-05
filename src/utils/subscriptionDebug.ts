import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    try {
      client = generateClient<Schema>();
    } catch (error) {
      console.warn('Amplify not configured yet, cannot initialize client:', error);
      throw new Error('Amplify not configured. Please ensure the app is properly initialized.');
    }
  }
  return client;
};

export const debugUserSubscription = async () => {
  try {
    console.log('=== SUBSCRIPTION DEBUG START ===');
    
    const client = getClient();
    
    // Get all subscriptions for the current user
    const { data: subscriptions } = await client.models.UserSubscription.list();
    
    console.log('Total subscriptions found:', subscriptions?.length || 0);
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`\n--- Subscription ${index + 1} ---`);
        console.log('ID:', sub.id);
        console.log('Stripe Customer ID:', sub.stripeCustomerId);
        console.log('Stripe Subscription ID:', sub.stripeSubscriptionId);
        console.log('Status:', sub.status);
        console.log('Plan Name:', sub.planName);
        console.log('Usage Count:', sub.usageCount);
        console.log('Usage Limit:', sub.usageLimit);
        console.log('Created At:', sub.createdAt);
        console.log('Updated At:', sub.updatedAt);
        console.log('Current Period Start:', sub.currentPeriodStart);
        console.log('Current Period End:', sub.currentPeriodEnd);
      });
    } else {
      console.log('No subscriptions found for current user');
    }
    
    // Get recent usage tracking
    const { data: usage } = await client.models.UsageTracking.list({ limit: 5 });
    console.log('\n--- Recent Usage ---');
    console.log('Recent usage records:', usage?.length || 0);
    usage?.forEach((record, index) => {
      console.log(`${index + 1}. ${record.operation} - ${record.tokensUsed} tokens - ${record.timestamp}`);
    });
    
    console.log('=== SUBSCRIPTION DEBUG END ===');
    
    return {
      subscriptions: subscriptions || [],
      usage: usage || []
    };
  } catch (error) {
    console.error('Debug subscription error:', error);
    throw error;
  }
};

export const fixUserSubscription = async (subscriptionId: string, planName: string = 'lite') => {
  try {
    console.log('Attempting to fix subscription:', subscriptionId, 'to plan:', planName);
    
    const client = getClient();
    
    // Plan limits mapping
    const planLimits: Record<string, number> = {
      'lite': 20000,
      'standard': 50000,
      'pro': 150000,
      'free': 1500
    };
    
    const usageLimit = planLimits[planName] || planLimits['lite'];
    
    // Update subscription to active status with correct limits
    const { data: updatedSub } = await client.models.UserSubscription.update({
      id: subscriptionId,
      status: 'active',
      planName: planName,
      usageLimit: usageLimit,
      usageCount: 0, // Reset usage for new subscription
      updatedAt: new Date().toISOString()
    });
    
    console.log('Subscription updated successfully:', updatedSub);
    return updatedSub;
  } catch (error) {
    console.error('Failed to fix subscription:', error);
    throw error;
  }
};

export const createLiteSubscription = async () => {
  try {
    console.log('Creating new Lite subscription...');
    
    const client = getClient();
    
    // Create a new lite subscription
    const { data: newSub } = await client.models.UserSubscription.create({
      stripeCustomerId: 'manual-fix-' + Date.now(),
      stripeSubscriptionId: undefined,
      stripePriceId: 'price_1SEAui47Knk6vC3kvBiS86dC', // Monthly Lite price ID
      status: 'active',
      planName: 'lite',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
      usageCount: 0,
      usageLimit: 20000, // Lite plan limit
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('New Lite subscription created:', newSub);
    return newSub;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
};
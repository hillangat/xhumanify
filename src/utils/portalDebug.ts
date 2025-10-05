import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const debugSubscriptionPortal = async () => {
  try {
    console.log('🔍 Debugging Subscription Portal Access');
    
    // Get all subscriptions for the current user
    const { data: subscriptions } = await client.models.UserSubscription.list();
    
    console.log('📊 Subscription Debug Info:');
    console.log('Total subscriptions found:', subscriptions?.length || 0);
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`\n--- Subscription ${index + 1} ---`);
        console.log('ID:', sub.id);
        console.log('Stripe Customer ID:', sub.stripeCustomerId);
        console.log('Stripe Subscription ID:', sub.stripeSubscriptionId);
        console.log('Status:', sub.status);
        console.log('Plan Name:', sub.planName);
        console.log('Created At:', sub.createdAt);
        console.log('Updated At:', sub.updatedAt);
        
        // Check if customer ID is valid for portal access
        if (sub.stripeCustomerId) {
          if (sub.stripeCustomerId.startsWith('cus_')) {
            console.log('✅ Valid Stripe Customer ID format');
          } else if (sub.stripeCustomerId === 'free-tier-user' || sub.stripeCustomerId.includes('manual-fix')) {
            console.log('⚠️ This is a local/manual customer ID - not valid for Stripe portal');
            console.log('💡 User needs to subscribe through Stripe to access portal');
          } else {
            console.log('❌ Invalid Stripe Customer ID format');
          }
        } else {
          console.log('❌ No Stripe Customer ID found');
        }
      });
    } else {
      console.log('❌ No subscriptions found for current user');
      console.log('💡 User needs to subscribe first to access portal');
    }
    
    return {
      subscriptions: subscriptions || [],
      hasValidStripeCustomer: subscriptions?.some(sub => 
        sub.stripeCustomerId && 
        sub.stripeCustomerId.startsWith('cus_')
      ) || false
    };
  } catch (error) {
    console.error('❌ Debug subscription error:', error);
    throw error;
  }
};

export const validatePortalAccess = (subscription: any) => {
  console.log('🔍 Validating Portal Access for:', subscription);
  
  if (!subscription) {
    return {
      canAccess: false,
      reason: 'No subscription found'
    };
  }
  
  if (!subscription.stripeCustomerId) {
    return {
      canAccess: false,
      reason: 'No Stripe Customer ID'
    };
  }
  
  if (!subscription.stripeCustomerId.startsWith('cus_')) {
    return {
      canAccess: false,
      reason: 'Invalid Stripe Customer ID format - this appears to be a local/manual subscription'
    };
  }
  
  if (subscription.stripeCustomerId === 'free-tier-user') {
    return {
      canAccess: false,
      reason: 'Free tier user - no Stripe subscription to manage'
    };
  }
  
  return {
    canAccess: true,
    reason: 'Valid Stripe customer'
  };
};
// Quick database check script for the webhook issue
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>({
  authMode: 'iam'
});

export const checkCustomerSubscription = async () => {
  console.log('🔍 Checking for customer: cus_TBe7HVjEXcfYEw');
  
  try {
    // Check for subscriptions with this Stripe customer ID
    const { data: subscriptions } = await client.models.UserSubscription.list({
      filter: {
        stripeCustomerId: { eq: 'cus_TBe7HVjEXcfYEw' }
      }
    });
    
    console.log('📊 Results for cus_TBe7HVjEXcfYEw:', subscriptions);
    
    if (subscriptions && subscriptions.length > 0) {
      console.log('✅ Found subscription records:');
      subscriptions.forEach((sub, index) => {
        console.log(`📋 Subscription ${index + 1}:`, {
          id: sub.id,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          planName: sub.planName,
          status: sub.status,
          usageCount: sub.usageCount,
          usageLimit: sub.usageLimit,
          updatedAt: sub.updatedAt
        });
      });
    } else {
      console.log('❌ No subscription records found for this customer');
      
      // Check for free-tier-user records that might need updating
      const { data: freeUsers } = await client.models.UserSubscription.list({
        filter: {
          stripeCustomerId: { eq: 'free-tier-user' }
        }
      });
      
      console.log('🔍 Free tier users that might need updating:', freeUsers?.length || 0);
      freeUsers?.forEach((user, index) => {
        console.log(`👤 Free user ${index + 1}:`, {
          id: user.id,
          planName: user.planName,
          status: user.status,
          usageCount: user.usageCount,
          owner: user.owner,
          updatedAt: user.updatedAt
        });
      });
    }
    
    // Also check for this specific subscription ID
    const { data: subById } = await client.models.UserSubscription.list({
      filter: {
        stripeSubscriptionId: { eq: 'sub_1SFGpg47Knk6vC3kDshcMEeC' }
      }
    });
    
    console.log('🔍 Checking by subscription ID sub_1SFGpg47Knk6vC3kDshcMEeC:', subById);
    
  } catch (error) {
    console.error('❌ Error checking customer subscription:', error);
  }
};
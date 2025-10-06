import type { ScheduledHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

// Lazy initialization to avoid module load time errors
let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    console.log('🔧 Initializing GraphQL client for monthly reset...');
    client = generateClient<Schema>({
      authMode: 'iam'
    });
  }
  return client;
};

export const handler: ScheduledHandler = async (event) => {
  console.log('Monthly usage reset triggered:', event);
  
  try {
    const client = getClient();
    
    // Reset usage for free tier users (those without active Stripe subscriptions)
    const { data: freeUsers } = await client.models.UserSubscription.list({
      filter: {
        and: [
          { planName: { eq: 'free' } },
          { 
            or: [
              { status: { attributeExists: false } },
              { stripeSubscriptionId: { attributeExists: false } }
            ]
          }
        ]
      }
    });
    
    if (freeUsers && freeUsers.length > 0) {
      console.log(`Resetting usage for ${freeUsers.length} free tier users`);
      
      // Reset usage count for all free tier users
      for (const user of freeUsers) {
        await client.models.UserSubscription.update({
          id: user.id,
          usageCount: 0, // Reset to 0 for new month
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('Free tier usage reset completed');
    } else {
      console.log('No free tier users found for reset');
    }
    
  } catch (error) {
    console.error('Error during monthly usage reset:', error);
  }
};
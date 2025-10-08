import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./src/amplify_outputs.json', 'utf8'));

Amplify.configure(config);

const client = generateClient({
  authMode: 'iam'
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking UserSubscription records...');
    
    // Using direct GraphQL query instead of Models API for better compatibility
    const listUserSubscriptionsQuery = /* GraphQL */ `
      query ListUserSubscriptions {
        listUserSubscriptions {
          items {
            id
            stripeCustomerId
            stripeSubscriptionId
            planName
            status
            usageCount
            usageLimit
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    const result = await client.graphql({
      query: listUserSubscriptionsQuery,
      authMode: 'iam'
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('❌ GraphQL Errors:', result.errors);
      return;
    }
    
    const subscriptions = result.data?.listUserSubscriptions?.items || [];
    
    console.log(`📊 Found ${subscriptions.length} subscription records:`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Customer ID: ${sub.stripeCustomerId}`);
      console.log(`  Subscription ID: ${sub.stripeSubscriptionId}`);
      console.log(`  Plan Name: "${sub.planName}"`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Usage: ${sub.usageCount}/${sub.usageLimit}`);
      console.log(`  Created: ${sub.createdAt}`);
    });
    
  } catch (error) {
    console.error('💥 Error checking database:', error);
  }
}

checkDatabase();
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import config from '../src/amplify_outputs.json' assert { type: 'json' };

Amplify.configure(config);

const client = generateClient({
  authMode: 'userPool'
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking UserSubscription records...');
    
    const { data: subscriptions, errors } = await client.models.UserSubscription.list();
    
    if (errors) {
      console.error('❌ Errors:', errors);
      return;
    }
    
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
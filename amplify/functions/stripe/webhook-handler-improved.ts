import type { APIGatewayProxyHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import Stripe from 'stripe';
// @ts-ignore
import { env } from '$amplify/env/handleWebhook';

console.log('🚀 IMPROVED WEBHOOK: Module loading started');

// Environment variables accessed through generated env object
console.log('🔍 IMPROVED WEBHOOK: Environment check:', {
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ? 'SET' : 'NOT_SET',
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT_SET'
});

// Lazy initialization variables (initialized inside handler)
let stripeClient: any = null;
let amplifyClient: any = null;

// Helper functions for plan mapping
function getPlanNameFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan names based on actual configuration
  const planMapping: Record<string, string> = {
    // Lite plan
    'price_1SEAui47Knk6vC3kvBiS86dC': 'Lite',
    'price_1SEBk147Knk6vC3kVV288Vmg': 'Lite',
    // Standard plan  
    'price_1SECNL47Knk6vC3kGQMZEwCH': 'Standard',
    'price_1SECNL47Knk6vC3kao99ug2W': 'Standard',
    // Pro plan
    'price_1SECQb47Knk6vC3kkvNYxIii': 'Pro',
    'price_1SECRf47Knk6vC3kaZmpEomz': 'Pro'
  };
  
  return planMapping[priceId] || 'Unknown Plan';
}

function getUsageLimitForPlan(planName: string): number {
  // Map plan names to word limits based on actual configuration
  const usageLimits: Record<string, number> = {
    'Lite': 20000,      // 20,000 words/month
    'Standard': 50000,  // 50,000 words/month  
    'Pro': 150000,      // 150,000 words/month
    'Unknown Plan': 0
  };
  
  return usageLimits[planName] || 0;
}

async function initializeStripe() {
  if (!stripeClient && env.STRIPE_SECRET_KEY) {
    console.log('⚡ IMPROVED WEBHOOK: Initializing Stripe client...');
    const Stripe = await import('stripe');
    stripeClient = new Stripe.default(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
    console.log('✅ IMPROVED WEBHOOK: Stripe client initialized');
  }
  return stripeClient;
}

async function initializeAmplify() {
  if (!amplifyClient) {
    try {
      console.log('⚡ IMPROVED WEBHOOK: Initializing Amplify client...');
      
      // Check what environment variables are actually available
      console.log('🔍 IMPROVED WEBHOOK: Available env vars:', {
        graphqlEndpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT ? 'SET' : 'NOT_SET',
        region: process.env.AWS_REGION,
        accessKey: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET'
      });
      
      // Use manual configuration since getAmplifyDataClientConfig expects different env structure
      if (process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT) {
        console.log('🔧 IMPROVED WEBHOOK: Using manual Amplify configuration');
        
        Amplify.configure({
          API: {
            GraphQL: {
              endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
              region: process.env.AWS_REGION || 'us-east-2',
              defaultAuthMode: 'iam'
            }
          }
        });
        
        // Generate client with Schema
        amplifyClient = generateClient<Schema>({
          authMode: 'iam'
        });
        
        console.log('✅ IMPROVED WEBHOOK: Amplify client initialized with manual config');
        console.log('🔍 IMPROVED WEBHOOK: Client object:', amplifyClient);
        console.log('🔍 IMPROVED WEBHOOK: Client models object:', amplifyClient.models);
        console.log('🔍 IMPROVED WEBHOOK: Client models available:', Object.keys(amplifyClient.models || {}));
        console.log('🔍 IMPROVED WEBHOOK: UserSubscription model:', amplifyClient.models?.UserSubscription);
        
        // Test if the models are accessible
        if (amplifyClient.models && amplifyClient.models.UserSubscription) {
          console.log('✅ IMPROVED WEBHOOK: UserSubscription model is accessible');
        } else {
          console.log('❌ IMPROVED WEBHOOK: UserSubscription model is NOT accessible');
          console.log('🔍 IMPROVED WEBHOOK: Available models:', amplifyClient.models ? Object.keys(amplifyClient.models) : 'models object is undefined');
        }
      } else {
        console.log('⚠️ IMPROVED WEBHOOK: No GraphQL endpoint found in environment');
        return null;
      }
      
    } catch (error) {
      console.error('❌ IMPROVED WEBHOOK: Failed to initialize Amplify:', error);
      // Continue without Amplify - webhook will still work for signature verification
      return null;
    }
  }
  return amplifyClient;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('🎯 IMPROVED WEBHOOK: Handler called');
  console.log('📝 IMPROVED WEBHOOK: Event method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ IMPROVED WEBHOOK: OPTIONS handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ IMPROVED WEBHOOK: Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = event.body;
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    console.log('🔍 IMPROVED WEBHOOK: Request details:', {
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body?.length || 0
    });

    // Basic validation
    if (!body) {
      console.log('❌ IMPROVED WEBHOOK: No request body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body' })
      };
    }

    // Initialize Stripe client
    const stripe = await initializeStripe();
    
    let stripeEvent: any = null;

    // Verify webhook signature if we have the secret
    if (env.STRIPE_WEBHOOK_SECRET && signature && stripe) {
      try {
        console.log('🔐 IMPROVED WEBHOOK: Verifying signature...');
        stripeEvent = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ IMPROVED WEBHOOK: Signature verified');
      } catch (err: any) {
        console.error('❌ IMPROVED WEBHOOK: Signature verification failed:', err.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    } else {
      // Parse JSON manually if no signature verification
      try {
        stripeEvent = JSON.parse(body);
        console.log('⚠️ IMPROVED WEBHOOK: Processing without signature verification');
      } catch (err) {
        console.error('❌ IMPROVED WEBHOOK: Invalid JSON:', err);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON' })
        };
      }
    }

    console.log('📦 IMPROVED WEBHOOK: Event type:', stripeEvent.type);
    console.log('🔍 IMPROVED WEBHOOK: Event ID:', stripeEvent.id);

    // Process different event types
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent);
        break;
      default:
        console.log('ℹ️ IMPROVED WEBHOOK: Unhandled event type:', stripeEvent.type);
    }

    console.log('✅ IMPROVED WEBHOOK: Event processed successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        eventType: stripeEvent.type,
        eventId: stripeEvent.id,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error: any) {
    console.error('💥 IMPROVED WEBHOOK: Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

async function handleSubscriptionCreated(event: any) {
  console.log('🎉 SUBSCRIPTION CREATED:', event.data.object.id);
  
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  console.log('📋 Subscription details:', {
    subscriptionId: subscription.id,
    customerId: customerId,
    status: subscription.status,
    planId: subscription.items.data[0]?.price?.id,
    hasItems: !!subscription.items?.data?.length,
    itemPeriodStart: subscription.items.data[0]?.current_period_start,
    itemPeriodEnd: subscription.items.data[0]?.current_period_end,
    startDate: subscription.start_date
  });

  // Initialize Amplify client for database operations
  const amplify = await initializeAmplify();
  
  if (amplify && amplify.models && amplify.models.UserSubscription) {
    try {
      console.log('💾 Creating subscription in database...');
      
      // Extract subscription details
      const planId = subscription.items.data[0]?.price?.id;
      const planName = getPlanNameFromPriceId(planId);
      
      // Get period dates from subscription items (where they actually exist in Stripe data)
      const subscriptionItem = subscription.items.data[0];
      
      // Create subscription record with safe date handling
      const now = new Date().toISOString();
      const subscriptionData = {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: planId,
        status: subscription.status,
        planName: planName,
        currentPeriodStart: subscriptionItem?.current_period_start 
          ? new Date(subscriptionItem.current_period_start * 1000).toISOString() 
          : (subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : now),
        currentPeriodEnd: subscriptionItem?.current_period_end 
          ? new Date(subscriptionItem.current_period_end * 1000).toISOString() 
          : now,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        usageCount: 0,
        usageLimit: getUsageLimitForPlan(planName),
        createdAt: now,
        updatedAt: now
      };
      
      console.log('📝 Creating subscription with data:', subscriptionData);
      
      const result = await amplify.models.UserSubscription.create(subscriptionData);
      
      console.log('✅ Subscription created in database:', result);
    } catch (dbError: any) {
      console.error('❌ Database create failed:', dbError);
      // Don't fail the webhook - Stripe expects 200 OK
    }
  } else {
    console.log('⚠️ Skipping database update - Amplify client or UserSubscription model not available');
    if (amplify) {
      console.log('🔍 Debug: amplify object exists but models may not be loaded');
      console.log('🔍 Debug: amplify.models:', amplify.models);
    } else {
      console.log('🔍 Debug: amplify client is null');
    }
  }
}

async function handleSubscriptionUpdated(event: any) {
  console.log('🔄 SUBSCRIPTION UPDATED:', event.data.object.id);
  
  const subscription = event.data.object;
  
  console.log('📋 Updated subscription:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });

  // Initialize Amplify client for database operations
  const amplify = await initializeAmplify();
  
  if (amplify) {
    try {
      console.log('💾 Updating subscription in database...');
      
      // Find existing subscription
      const existingSubscriptions = await amplify.models.UserSubscription.list({
        filter: {
          stripeSubscriptionId: {
            eq: subscription.id
          }
        }
      });
      
      if (existingSubscriptions.data.length > 0) {
        const existingSubscription = existingSubscriptions.data[0];
        
        // Update subscription data with safe date handling
        const subscriptionItem = subscription.items.data[0];
        const now = new Date().toISOString();
        const updateData = {
          status: subscription.status,
          currentPeriodStart: subscriptionItem?.current_period_start 
            ? new Date(subscriptionItem.current_period_start * 1000).toISOString() 
            : (subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : now),
          currentPeriodEnd: subscriptionItem?.current_period_end 
            ? new Date(subscriptionItem.current_period_end * 1000).toISOString() 
            : now,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          updatedAt: now
        };
        
        console.log('📝 Updating subscription with data:', updateData);
        
        const result = await amplify.models.UserSubscription.update({
          id: existingSubscription.id,
          ...updateData
        });
        
        console.log('✅ Subscription updated in database:', result);
      } else {
        console.log('⚠️ Subscription not found in database for update');
      }
    } catch (dbError: any) {
      console.error('❌ Database update failed:', dbError);
      // Don't fail the webhook - Stripe expects 200 OK
    }
  } else {
    console.log('⚠️ Skipping database update - Amplify client not available');
  }
}

async function handleSubscriptionDeleted(event: any) {
  console.log('🗑️ SUBSCRIPTION DELETED:', event.data.object.id);
  
  const subscription = event.data.object;
  
  console.log('📋 Deleted subscription:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  // Initialize Amplify client for database operations
  const amplify = await initializeAmplify();
  
  if (amplify) {
    try {
      console.log('💾 Marking subscription as canceled in database...');
      
      // Find existing subscription
      const existingSubscriptions = await amplify.models.UserSubscription.list({
        filter: {
          stripeSubscriptionId: {
            eq: subscription.id
          }
        }
      });
      
      if (existingSubscriptions.data.length > 0) {
        const existingSubscription = existingSubscriptions.data[0];
        
        // Update subscription to canceled status
        const result = await amplify.models.UserSubscription.update({
          id: existingSubscription.id,
          status: 'canceled',
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Subscription marked as canceled in database:', result);
      } else {
        console.log('⚠️ Subscription not found in database for deletion');
      }
    } catch (dbError: any) {
      console.error('❌ Database deletion failed:', dbError);
      // Don't fail the webhook - Stripe expects 200 OK
    }
  } else {
    console.log('⚠️ Skipping database update - Amplify client not available');
  }
}

async function handlePaymentSucceeded(event: any) {
  console.log('💰 PAYMENT SUCCEEDED:', event.data.object.id);
  
  const invoice = event.data.object;
  
  console.log('📋 Payment details:', {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    customerId: invoice.customer
  });

  // TODO: Implement payment success logic
}

async function handlePaymentFailed(event: any) {
  console.log('💳 PAYMENT FAILED:', event.data.object.id);
  
  const invoice = event.data.object;
  
  console.log('📋 Failed payment:', {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    customerId: invoice.customer
  });

  // TODO: Implement payment failure logic
}

console.log('✅ IMPROVED WEBHOOK: Module loaded completely');
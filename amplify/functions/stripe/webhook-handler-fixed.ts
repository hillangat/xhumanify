import type { APIGatewayProxyHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import Stripe from 'stripe';
// @ts-ignore
import { env } from '$amplify/env/handleWebhook';

console.log('🚀 FIXED WEBHOOK: Module loading started');

// Environment variables accessed through generated env object
console.log('🔍 FIXED WEBHOOK: Environment check:', {
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
    'price_1SECXK47Knk6vC3kRiBZvOAZ': 'Pro',
    'price_1SECXK47Knk6vC3k6hQVrq8S': 'Pro'
  };
  
  return planMapping[priceId] || 'Unknown';
}

function getUsageLimitForPlan(planName: string): number {
  const usageLimits: Record<string, number> = {
    'Lite': 20000,
    'Standard': 100000,
    'Pro': 500000
  };
  
  return usageLimits[planName] || 20000;
}

async function initializeStripe() {
  if (!stripeClient && env.STRIPE_SECRET_KEY) {
    console.log('⚡ FIXED WEBHOOK: Initializing Stripe client...');
    const Stripe = await import('stripe');
    stripeClient = new Stripe.default(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
    console.log('✅ FIXED WEBHOOK: Stripe client initialized');
  }
  return stripeClient;
}

async function initializeAmplify() {
  if (!amplifyClient) {
    try {
      console.log('⚡ FIXED WEBHOOK: Initializing Amplify client...');
      
      console.log('🔍 FIXED WEBHOOK: Environment status:', {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
        region: process.env.AWS_REGION,
        hasEndpoint: !!process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT
      });
      
      // Use direct configuration with proper AWS credentials
      if (process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT) {
        console.log('🔧 FIXED WEBHOOK: Using direct AWS SDK credentials configuration');
        
        // Configure Amplify with direct AWS credentials
        Amplify.configure({
          API: {
            GraphQL: {
              endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
              region: process.env.AWS_REGION || 'us-east-2',
              defaultAuthMode: 'iam'
            }
          }
        }, {
          Auth: {
            credentialsProvider: {
              getCredentialsAndIdentityId: async () => ({
                credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                  sessionToken: process.env.AWS_SESSION_TOKEN
                }
              }),
              clearCredentialsAndIdentityId: () => {
                // No-op for Lambda environment
              }
            }
          }
        });
        
        // Create the GraphQL client
        amplifyClient = generateClient({
          authMode: 'iam'
        });
        
        console.log('✅ FIXED WEBHOOK: Amplify GraphQL client initialized');
        console.log('🔍 FIXED WEBHOOK: Client structure:', {
          hasGraphql: typeof amplifyClient.graphql === 'function',
          endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
          region: process.env.AWS_REGION
        });
      } else {
        console.log('⚠️ FIXED WEBHOOK: No GraphQL endpoint found in environment');
        return null;
      }
      
    } catch (error) {
      console.error('❌ FIXED WEBHOOK: Failed to initialize Amplify:', error);
      console.error('❌ FIXED WEBHOOK: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      // Continue without Amplify - webhook will still work for signature verification
      return null;
    }
  }
  return amplifyClient;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('🎯 FIXED WEBHOOK: Handler called');
  console.log('📝 FIXED WEBHOOK: Event method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ FIXED WEBHOOK: OPTIONS handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Validate request body and signature
    const hasBody = !!event.body;
    const hasSignature = !!(event.headers['stripe-signature'] || event.headers['Stripe-Signature']);
    const bodyLength = event.body ? event.body.length : 0;
    
    console.log('🔍 FIXED WEBHOOK: Request details:', { hasBody, hasSignature, bodyLength });
    
    if (!hasBody) {
      console.log('❌ FIXED WEBHOOK: No request body received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    // Initialize Stripe client
    const stripe = await initializeStripe();
    if (!stripe) {
      console.error('❌ FIXED WEBHOOK: Failed to initialize Stripe client');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe initialization failed' })
      };
    }

    // Verify webhook signature
    if (hasSignature && env.STRIPE_WEBHOOK_SECRET) {
      console.log('🔐 FIXED WEBHOOK: Verifying signature...');
      const stripeSignature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
      
      try {
        const webhookEvent = stripe.webhooks.constructEvent(
          event.body,
          stripeSignature!,
          env.STRIPE_WEBHOOK_SECRET
        );
        
        console.log('✅ FIXED WEBHOOK: Signature verified');
        console.log('📦 FIXED WEBHOOK: Event type:', webhookEvent.type);
        console.log('🔍 FIXED WEBHOOK: Event ID:', webhookEvent.id);
        
        // Handle different event types
        switch (webhookEvent.type) {
          case 'customer.subscription.created':
            await handleSubscriptionCreated(webhookEvent);
            break;
          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(webhookEvent);
            break;
          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(webhookEvent);
            break;
          case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(webhookEvent);
            break;
          case 'invoice.payment_failed':
            await handlePaymentFailed(webhookEvent);
            break;
          default:
            console.log(`⚠️ FIXED WEBHOOK: Unhandled event type: ${webhookEvent.type}`);
        }
        
        console.log('✅ FIXED WEBHOOK: Event processed successfully');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            received: true,
            eventType: webhookEvent.type,
            eventId: webhookEvent.id,
            timestamp: new Date().toISOString()
          })
        };
      } catch (signatureError: any) {
        console.error('❌ FIXED WEBHOOK: Signature verification failed:', signatureError.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    } else {
      console.log('⚠️ FIXED WEBHOOK: No signature verification (signature or secret missing)');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Signature verification required' })
      };
    }

  } catch (error: any) {
    console.error('💥 FIXED WEBHOOK: Error processing webhook:', error);
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
  
  if (amplify && amplify.graphql) {
    try {
      console.log('💾 Creating subscription in database using GraphQL...');
      
      // Extract subscription details
      const planId = subscription.items.data[0]?.price?.id;
      const planName = getPlanNameFromPriceId(planId);
      
      // Get period dates from subscription items (where they actually exist in Stripe data)
      const subscriptionItem = subscription.items.data[0];
      
      // Create subscription record with safe date handling
      const now = new Date().toISOString();
      
      // Create UserSubscription using GraphQL mutation
      const createUserSubscriptionMutation = /* GraphQL */ `
        mutation CreateUserSubscription($input: CreateUserSubscriptionInput!) {
          createUserSubscription(input: $input) {
            id
            stripeCustomerId
            stripeSubscriptionId
            status
            planName
            createdAt
          }
        }
      `;
      
      const subscriptionInput = {
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
      
      console.log('📝 Creating subscription with GraphQL input:', subscriptionInput);
      
      const result = await amplify.graphql({
        query: createUserSubscriptionMutation,
        variables: { input: subscriptionInput },
        authMode: 'iam'
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error('❌ GraphQL errors:', result.errors);
      } else {
        console.log('✅ Subscription created in database:', result.data);
      }
    } catch (dbError: any) {
      console.error('❌ Database create failed:', dbError);
      console.error('❌ Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      // Don't fail the webhook - Stripe expects 200 OK
    }
  } else {
    console.log('⚠️ Skipping database update - GraphQL client not available');
    if (amplify) {
      console.log('🔍 Debug: amplify object exists but GraphQL client may not be loaded');
      console.log('🔍 Debug: amplify structure:', amplify);
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
  
  if (amplify && amplify.graphql) {
    try {
      console.log('💾 Updating subscription in database using GraphQL...');
      
      // First, query to find the existing subscription
      const listUserSubscriptionsQuery = /* GraphQL */ `
        query ListUserSubscriptions($filter: ModelUserSubscriptionFilterInput) {
          listUserSubscriptions(filter: $filter) {
            items {
              id
              stripeSubscriptionId
              status
            }
          }
        }
      `;
      
      const listResult = await amplify.graphql({
        query: listUserSubscriptionsQuery,
        variables: {
          filter: {
            stripeSubscriptionId: {
              eq: subscription.id
            }
          }
        },
        authMode: 'iam'
      });
      
      if (listResult.data?.listUserSubscriptions?.items?.length > 0) {
        const existingSubscription = listResult.data.listUserSubscriptions.items[0];
        
        // Update the subscription
        const updateUserSubscriptionMutation = /* GraphQL */ `
          mutation UpdateUserSubscription($input: UpdateUserSubscriptionInput!) {
            updateUserSubscription(input: $input) {
              id
              stripeSubscriptionId
              status
              updatedAt
            }
          }
        `;
        
        const updateInput = {
          id: existingSubscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          updatedAt: new Date().toISOString()
        };
        
        const updateResult = await amplify.graphql({
          query: updateUserSubscriptionMutation,
          variables: { input: updateInput },
          authMode: 'iam'
        });
        
        console.log('✅ Subscription updated in database:', updateResult);
      } else {
        console.log('⚠️ No existing subscription found to update');
      }
    } catch (dbError: any) {
      console.error('❌ Database update failed:', dbError);
      // Don't fail the webhook
    }
  } else {
    console.log('⚠️ Skipping database update - GraphQL client not available');
  }
}

async function handleSubscriptionDeleted(event: any) {
  console.log('🗑️ SUBSCRIPTION DELETED:', event.data.object.id);
  
  const subscription = event.data.object;
  
  // Initialize Amplify client for database operations
  const amplify = await initializeAmplify();
  
  if (amplify && amplify.graphql) {
    try {
      console.log('💾 Deleting subscription in database using GraphQL...');
      
      // First, find the subscription to delete
      const listUserSubscriptionsQuery = /* GraphQL */ `
        query ListUserSubscriptions($filter: ModelUserSubscriptionFilterInput) {
          listUserSubscriptions(filter: $filter) {
            items {
              id
              stripeSubscriptionId
            }
          }
        }
      `;
      
      const listResult = await amplify.graphql({
        query: listUserSubscriptionsQuery,
        variables: {
          filter: {
            stripeSubscriptionId: {
              eq: subscription.id
            }
          }
        },
        authMode: 'iam'
      });
      
      if (listResult.data?.listUserSubscriptions?.items?.length > 0) {
        const existingSubscription = listResult.data.listUserSubscriptions.items[0];
        
        // Delete the subscription
        const deleteUserSubscriptionMutation = /* GraphQL */ `
          mutation DeleteUserSubscription($input: DeleteUserSubscriptionInput!) {
            deleteUserSubscription(input: $input) {
              id
              stripeSubscriptionId
            }
          }
        `;
        
        const deleteResult = await amplify.graphql({
          query: deleteUserSubscriptionMutation,
          variables: { input: { id: existingSubscription.id } },
          authMode: 'iam'
        });
        
        console.log('✅ Subscription deleted from database:', deleteResult);
      } else {
        console.log('⚠️ No existing subscription found to delete');
      }
    } catch (dbError: any) {
      console.error('❌ Database delete failed:', dbError);
      // Don't fail the webhook
    }
  } else {
    console.log('⚠️ Skipping database update - GraphQL client not available');
  }
}

async function handlePaymentSucceeded(event: any) {
  console.log('💰 PAYMENT SUCCEEDED:', event.data.object.id);
  
  const invoice = event.data.object;
  console.log('📋 Payment details:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amountPaid: invoice.amount_paid,
    status: invoice.status
  });
  
  // Could update payment history or reset usage counts here
}

async function handlePaymentFailed(event: any) {
  console.log('❌ PAYMENT FAILED:', event.data.object.id);
  
  const invoice = event.data.object;
  console.log('📋 Failed payment details:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count
  });
  
  // Could handle payment failure logic here (suspend access, send notifications, etc.)
}

console.log('✅ FIXED WEBHOOK: Module loaded completely');
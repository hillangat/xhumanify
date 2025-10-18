import type { APIGatewayProxyHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import Stripe from 'stripe';
import { PLAN_LIMITS } from '../../shared/planConfig';
// @ts-ignore
import { env } from '$amplify/env/handleWebhook';

// Configure Amplify with direct approach that works reliably
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
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

// Create typed client for database operations
const client = generateClient<Schema>({
  authMode: 'iam'
});

// Helper functions for plan mapping
function getPlanNameFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan names based on actual configuration from frontend
  // Using lowercase to match database format (existing 'free' plan uses lowercase)
  const planMapping: Record<string, string> = {
    // Lite plan
    'price_1SEAui47Knk6vC3kvBiS86dC': 'lite',  // monthly
    'price_1SEBk147Knk6vC3kVV288Vmg': 'lite',  // yearly
    // Standard plan  
    'price_1SECNL47Knk6vC3kGQMZEwCH': 'standard',  // monthly
    'price_1SECNL47Knk6vC3kao99ug2W': 'standard',  // yearly
    // Pro plan - using price IDs from frontend config
    'price_1SECQb47Knk6vC3kkvNYxIii': 'pro',  // monthly 
    'price_1SECRf47Knk6vC3kaZmpEomz': 'pro'   // yearly
  };
  
  const planName = planMapping[priceId] || 'unknown';
  console.log(`🔍 Plan mapping: ${priceId} -> ${planName}`);
  console.log(`🔍 Available price IDs: ${Object.keys(planMapping).join(', ')}`);
  return planName;
}

function getUsageLimitForPlan(planName: string): number {
  // Use shared plan configuration to ensure consistency across the application
  const planConfig = PLAN_LIMITS[planName];
  
  if (planConfig) {
    const limit = planConfig.usageLimit;
    console.log(`🔍 Usage limit for plan "${planName}" from shared config: ${limit}`);
    return limit;
  }
  
  // Fallback for unknown plans
  const defaultLimit = 20000;
  console.log(`⚠️ Unknown plan "${planName}", using default limit: ${defaultLimit}`);
  return defaultLimit;
}

// Lazy initialization variables
let stripeClient: any = null;

async function initializeStripe() {
  if (!stripeClient && env.STRIPE_SECRET_KEY) {
    const Stripe = await import('stripe');
    stripeClient = new Stripe.default(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  }
  return stripeClient;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  
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

async function deactivateExistingSubscriptions(userId: string) {
  if (!userId) {
    console.log('⚠️ No userId provided, skipping existing subscription deactivation');
    return;
  }

  console.log('🔍 Checking for existing active subscriptions for user:', userId);
  
  // Strategy 1: Try Models API first (preferred)
  let existingSubscriptions: any[] = [];
  let useModelsAPI = false;
  
  try {
    if (client?.models?.UserSubscription?.list) {
      console.log('🔄 Attempting Models API approach...');
      const { data: activeSubscriptions } = await client.models.UserSubscription.list({
        filter: {
          userId: { eq: userId },
          status: { eq: 'active' }
        },
        authMode: 'iam'
      });
      
      existingSubscriptions = activeSubscriptions || [];
      useModelsAPI = true;
      console.log(`✅ Models API successful: Found ${existingSubscriptions.length} active subscriptions`);
    } else {
      throw new Error('Models API not available');
    }
  } catch (modelsError) {
    console.log('⚠️ Models API failed, falling back to GraphQL:', modelsError instanceof Error ? modelsError.message : 'Unknown error');
    
    // Strategy 2: Fallback to direct GraphQL
    try {
      console.log('🔄 Attempting GraphQL fallback...');
      const listQuery = /* GraphQL */ `
        query ListUserSubscriptions($filter: ModelUserSubscriptionFilterInput) {
          listUserSubscriptions(filter: $filter) {
            items {
              id
              userId
              stripeSubscriptionId
              status
              planName
              createdAt
              updatedAt
            }
          }
        }
      `;
      
      const result = await client.graphql({
        query: listQuery,
        variables: {
          filter: {
            userId: { eq: userId },
            status: { eq: 'active' }
          }
        },
        authMode: 'iam'
      }) as any;
      
      existingSubscriptions = result?.data?.listUserSubscriptions?.items || [];
      useModelsAPI = false;
      console.log(`✅ GraphQL successful: Found ${existingSubscriptions.length} active subscriptions`);
    } catch (graphqlError) {
      console.error('❌ Both Models API and GraphQL failed:', graphqlError);
      console.error('❌ Cannot proceed with subscription deactivation');
      return;
    }
  }
  
  // Process found subscriptions
  if (existingSubscriptions.length === 0) {
    console.log('✅ No existing active subscriptions found for user');
    return;
  }
  
  console.log(`🔄 Found ${existingSubscriptions.length} existing active subscriptions to mark as canceled`);
  
  // Mark each subscription as canceled
  for (const sub of existingSubscriptions) {
    try {
      console.log(`📝 Marking subscription ${sub.id} as canceled (plan: ${sub.planName || 'unknown'})`);
      
      if (useModelsAPI) {
        // Use Models API for update
        await client.models.UserSubscription.update({
          id: sub.id,
          status: 'canceled',
          updatedAt: new Date().toISOString()
        }, {
          authMode: 'iam'
        });
      } else {
        // Use GraphQL for update
        const updateMutation = /* GraphQL */ `
          mutation UpdateUserSubscription($input: UpdateUserSubscriptionInput!) {
            updateUserSubscription(input: $input) {
              id
              status
              updatedAt
            }
          }
        `;
        
        await client.graphql({
          query: updateMutation,
          variables: {
            input: {
              id: sub.id,
              status: 'canceled',
              updatedAt: new Date().toISOString()
            }
          },
          authMode: 'iam'
        });
      }
      
      console.log(`✅ Successfully marked subscription ${sub.id} as canceled`);
    } catch (updateError) {
      console.error(`❌ Failed to mark subscription ${sub.id} as canceled:`, updateError);
      // Continue with other subscriptions even if one fails
    }
  }
  
  console.log(`✅ Completed deactivation process for user ${userId}`);
}

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

  // Extract userId from Stripe Checkout Session
  let userId = null;
  try {
    const stripe = await initializeStripe();
    // List sessions for this customer, most recent first
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 1
    });
    const session = sessions.data[0];
    if (session) {
      userId = session.client_reference_id || session.metadata?.userId || null;
      console.log('🔗 Found app user ID from Checkout Session:', userId);
    } else {
      console.warn('⚠️ No Checkout Session found for customer:', customerId);
    }
  } catch (err) {
    console.error('❌ Error fetching Checkout Session (continuing without userId):', err instanceof Error ? err.message : 'Unknown error');
    console.warn('⚠️ Subscription will be created without userId - user may need to re-authenticate to see subscription');
  }

  try {
    console.log('💾 Creating subscription in database using Models API...');
    
    // IMPORTANT: Deactivate existing subscriptions before creating new one
    if (userId) {
      await deactivateExistingSubscriptions(userId);
    }
    
    // Extract subscription details
    const planId = subscription.items.data[0]?.price?.id;
    console.log(`🔍 Raw price ID from Stripe: ${planId}`);
    
    const planName = getPlanNameFromPriceId(planId);
    console.log(`🔍 Mapped plan name: "${planName}"`);
    
    // Get period dates from subscription items (where they actually exist in Stripe data)
    const subscriptionItem = subscription.items.data[0];
    
    // Create subscription record with safe date handling
    const now = new Date().toISOString();
    const usageLimit = getUsageLimitForPlan(planName);
    
    // Create UserSubscription using Models API
    const subscriptionInput = {
      userId: userId, // Include userId from checkout session
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
      usageLimit: usageLimit,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('📝 Creating subscription with Models API input:', JSON.stringify(subscriptionInput, null, 2));
    
    // Debug client structure
    console.log('🔍 Debug client structure:', {
      hasClient: !!client,
      hasModels: !!client?.models,
      hasUserSubscription: !!client?.models?.UserSubscription,
      clientKeys: client ? Object.keys(client) : 'NO_CLIENT',
      modelsKeys: client?.models ? Object.keys(client.models) : 'NO_MODELS'
    });
    
    if (!client?.models?.UserSubscription) {
      console.error('❌ Models API not available - falling back to GraphQL');
      
      // Fallback to direct GraphQL mutation
      const createUserSubscriptionMutation = /* GraphQL */ `
        mutation CreateUserSubscription($input: CreateUserSubscriptionInput!) {
          createUserSubscription(input: $input) {
            id
            userId
            stripeCustomerId
            stripeSubscriptionId
            stripePriceId
            status
            planName
            currentPeriodStart
            currentPeriodEnd
            cancelAtPeriodEnd
            usageCount
            usageLimit
            createdAt
            updatedAt
          }
        }
      `;
      
      console.log('🔄 Attempting GraphQL fallback with mutation...');
      const result = await client.graphql({
        query: createUserSubscriptionMutation,
        variables: { input: subscriptionInput },
        authMode: 'iam'
      }) as any; // Type assertion to handle GraphQL result types
      
      if (result?.errors && result.errors.length > 0) {
        console.error('❌ GraphQL errors:', JSON.stringify(result.errors, null, 2));
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      } else {
        console.log('✅ Subscription created via GraphQL fallback!');
        console.log('📋 Created record:', JSON.stringify(result?.data?.createUserSubscription, null, 2));
        
        // Verify the record was actually created by querying it back
        try {
          console.log('🔍 Verifying record creation by querying back...');
          const verifyQuery = /* GraphQL */ `
            query GetUserSubscription($id: ID!) {
              getUserSubscription(id: $id) {
                id
                userId
                stripeCustomerId
                stripeSubscriptionId
                stripePriceId
                planName
                usageCount
                usageLimit
                status
              }
            }
          `;
          
          const verifyResult = await client.graphql({
            query: verifyQuery,
            variables: { id: result?.data?.createUserSubscription?.id },
            authMode: 'iam'
          }) as any;
          
          if (verifyResult?.data?.getUserSubscription) {
            console.log('✅ Record verification successful:', JSON.stringify(verifyResult.data.getUserSubscription, null, 2));
          } else {
            console.error('❌ Record verification failed - record not found in database');
          }
        } catch (verifyError) {
          console.error('❌ Record verification error:', verifyError);
        }
      }
      return;
    }
    
    // Use the Models API instead of raw GraphQL
    console.log('🔄 Attempting Models API creation...');
    const result = await client.models.UserSubscription.create(subscriptionInput);
    
    console.log('✅ Subscription created via Models API!');
    console.log('📋 Created record:', JSON.stringify(result, null, 2));
  } catch (dbError: any) {
    console.error('❌ Database create failed:', dbError);
    console.error('❌ Error details:', {
      message: dbError.message,
      stack: dbError.stack,
      name: dbError.name
    });
    // Don't fail the webhook - Stripe expects 200 OK
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

  try {
    console.log('💾 Updating subscription in database using Models API...');
    
    // First, find the existing subscription
    const { data: existingSubscriptions } = await client.models.UserSubscription.list({
      filter: {
        stripeSubscriptionId: {
          eq: subscription.id
        }
      }
    });
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSubscription = existingSubscriptions[0];
      
      // Update the subscription
      const updateInput = {
        id: existingSubscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        updatedAt: new Date().toISOString()
      };
      
      const result = await client.models.UserSubscription.update(updateInput);
      
      console.log('✅ Subscription updated in database:', result);
    } else {
      console.log('⚠️ No existing subscription found to update');
    }
  } catch (dbError: any) {
    console.error('❌ Database update failed:', dbError);
    // Don't fail the webhook
  }
}

async function handleSubscriptionDeleted(event: any) {
  console.log('🗑️ SUBSCRIPTION DELETED:', event.data.object.id);
  
  const subscription = event.data.object;
  
  try {
    console.log('💾 Deleting subscription in database using Models API...');
    
    // First, find the subscription to delete
    const { data: existingSubscriptions } = await client.models.UserSubscription.list({
      filter: {
        stripeSubscriptionId: {
          eq: subscription.id
        }
      }
    });
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSubscription = existingSubscriptions[0];
      
      // Delete the subscription
      const result = await client.models.UserSubscription.delete({ id: existingSubscription.id });
      
      console.log('✅ Subscription deleted from database:', result);
    } else {
      console.log('⚠️ No existing subscription found to delete');
    }
  } catch (dbError: any) {
    console.error('❌ Database delete failed:', dbError);
    // Don't fail the webhook
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
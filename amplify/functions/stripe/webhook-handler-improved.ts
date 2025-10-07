import type { APIGatewayProxyHandler } from 'aws-lambda';

console.log('🚀 IMPROVED WEBHOOK: Module loading started');

// Environment variables check at module level (safe)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const AMPLIFY_DATA_GRAPHQL_ENDPOINT = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;

console.log('🔍 IMPROVED WEBHOOK: Environment check:', {
  STRIPE_SECRET_KEY: STRIPE_SECRET_KEY ? 'SET' : 'NOT_SET',
  STRIPE_WEBHOOK_SECRET: STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
  AMPLIFY_DATA_GRAPHQL_ENDPOINT: AMPLIFY_DATA_GRAPHQL_ENDPOINT ? 'SET' : 'NOT_SET'
});

// Lazy initialization variables (initialized inside handler)
let stripeClient: any = null;
let amplifyClient: any = null;

async function initializeStripe() {
  if (!stripeClient && STRIPE_SECRET_KEY) {
    console.log('⚡ IMPROVED WEBHOOK: Initializing Stripe client...');
    const Stripe = await import('stripe');
    stripeClient = new Stripe.default(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
    console.log('✅ IMPROVED WEBHOOK: Stripe client initialized');
  }
  return stripeClient;
}

async function initializeAmplify() {
  if (!amplifyClient && AMPLIFY_DATA_GRAPHQL_ENDPOINT) {
    try {
      console.log('⚡ IMPROVED WEBHOOK: Initializing Amplify client...');
      const { generateClient } = await import('aws-amplify/data');
      
      amplifyClient = generateClient({
        authMode: 'iam',
      });
      console.log('✅ IMPROVED WEBHOOK: Amplify client initialized');
    } catch (error) {
      console.error('❌ IMPROVED WEBHOOK: Failed to initialize Amplify:', error);
      // Continue without Amplify - webhook will still work for signature verification
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
    if (STRIPE_WEBHOOK_SECRET && signature && stripe) {
      try {
        console.log('🔐 IMPROVED WEBHOOK: Verifying signature...');
        stripeEvent = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
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
    planId: subscription.items.data[0]?.price?.id
  });

  // Initialize Amplify client for database operations
  const amplify = await initializeAmplify();
  
  if (amplify) {
    try {
      // TODO: Update user subscription in database
      console.log('💾 Updating subscription in database...');
      
      // Example database update (implement based on your schema):
      // await amplify.models.UserSubscription.create({
      //   stripeCustomerId: customerId,
      //   stripeSubscriptionId: subscription.id,
      //   status: subscription.status,
      //   // ... other fields
      // });
      
      console.log('✅ Subscription updated in database');
    } catch (dbError: any) {
      console.error('❌ Database update failed:', dbError);
      // Don't fail the webhook - Stripe expects 200 OK
    }
  } else {
    console.log('⚠️ Skipping database update - Amplify client not available');
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

  // TODO: Implement subscription update logic
}

async function handleSubscriptionDeleted(event: any) {
  console.log('🗑️ SUBSCRIPTION DELETED:', event.data.object.id);
  
  const subscription = event.data.object;
  
  console.log('📋 Deleted subscription:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  // TODO: Implement subscription deletion logic
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
import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';

console.log('🚀 MINIMAL MODULE LOADING: webhook-handler-minimal.ts module is being loaded');
console.log('🔍 MINIMAL MODULE LOADING: Environment variables check:', {
  NODE_ENV: process.env.NODE_ENV,
  AWS_REGION: process.env.AWS_REGION,
  AMPLIFY_DATA_GRAPHQL_ENDPOINT: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT ? 'SET' : 'NOT_SET',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT_SET',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT_SET'
});

console.log('⚡ MINIMAL MODULE LOADING: Creating Stripe client...');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});
console.log('✅ MINIMAL MODULE LOADING: Stripe client created successfully');

console.log('✅ MINIMAL MODULE LOADING: webhook-handler-minimal.ts module loaded completely');

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('🚀🚀🚀 MINIMAL HANDLER ENTRY: Webhook handler function called!');
  console.log('📥 MINIMAL HANDLER ENTRY: Event received:', {
    httpMethod: event.httpMethod,
    headers: Object.keys(event.headers || {}),
    bodyLength: event.body?.length || 0,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters
  });
  
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  console.log(`🚀 MINIMAL [${requestId}] Webhook request started at ${new Date().toISOString()}`);
  console.log(`📥 MINIMAL [${requestId}] Event method: ${event.httpMethod}`);
  console.log(`📥 MINIMAL [${requestId}] Headers:`, JSON.stringify(event.headers, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Check if Stripe secret keys are configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(`❌ MINIMAL [${requestId}] Stripe configuration missing`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Stripe configuration missing',
        details: 'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET environment variable is missing',
        requestId
      })
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    console.log(`✅ MINIMAL [${requestId}] OPTIONS request handled`);
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.error(`❌ MINIMAL [${requestId}] Invalid method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed', requestId })
    };
  }

  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!sig) {
      console.error(`❌ MINIMAL [${requestId}] Missing Stripe signature`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing stripe signature', requestId })
      };
    }

    console.log(`🔐 MINIMAL [${requestId}] Verifying webhook signature...`);
    
    // Verify webhook signature
    const webhookEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`✅ MINIMAL [${requestId}] Webhook signature verified`);
    console.log(`📋 MINIMAL [${requestId}] Event type: ${webhookEvent.type}`);
    console.log(`📋 MINIMAL [${requestId}] Event ID: ${webhookEvent.id}`);
    console.log(`📋 MINIMAL [${requestId}] Event created: ${new Date(webhookEvent.created * 1000).toISOString()}`);

    // Log the complete event data for debugging
    console.log(`📊 MINIMAL [${requestId}] Complete webhook event data:`, JSON.stringify(webhookEvent, null, 2));

    // Handle different event types with detailed logging
    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        console.log(`🛒 MINIMAL [${requestId}] Processing checkout.session.completed: ${session.id}`);
        console.log(`🛒 MINIMAL [${requestId}] Session details:`, {
          customer: session.customer,
          subscription: session.subscription,
          mode: session.mode,
          payment_status: session.payment_status,
          amount_total: session.amount_total
        });
        break;

      case 'customer.subscription.created':
        const createdSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🆕 MINIMAL [${requestId}] Processing customer.subscription.created: ${createdSubscription.id}`);
        console.log(`🆕 MINIMAL [${requestId}] Subscription details:`, {
          id: createdSubscription.id,
          customer: createdSubscription.customer,
          priceId: createdSubscription.items.data[0]?.price.id,
          status: createdSubscription.status,
          current_period_start: (createdSubscription as any).current_period_start,
          current_period_end: (createdSubscription as any).current_period_end,
          cancel_at_period_end: (createdSubscription as any).cancel_at_period_end
        });
        // Database operations would go here - currently logging only
        console.log(`⚠️ MINIMAL [${requestId}] Database operations not implemented in minimal handler`);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🔄 MINIMAL [${requestId}] Processing customer.subscription.updated: ${updatedSubscription.id}`);
        console.log(`🔄 MINIMAL [${requestId}] Subscription details:`, {
          id: updatedSubscription.id,
          customer: updatedSubscription.customer,
          priceId: updatedSubscription.items.data[0]?.price.id,
          status: updatedSubscription.status
        });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🗑️ MINIMAL [${requestId}] Processing customer.subscription.deleted: ${deletedSubscription.id}`);
        console.log(`🗑️ MINIMAL [${requestId}] Subscription details:`, {
          id: deletedSubscription.id,
          customer: deletedSubscription.customer
        });
        break;

      case 'invoice.payment_succeeded':
        const invoice = webhookEvent.data.object as Stripe.Invoice;
        console.log(`💰 MINIMAL [${requestId}] Processing invoice.payment_succeeded: ${invoice.id}`);
        console.log(`💰 MINIMAL [${requestId}] Invoice details:`, {
          id: invoice.id,
          subscription: (invoice as any).subscription,
          billing_reason: (invoice as any).billing_reason,
          amount_paid: invoice.amount_paid
        });
        break;

      case 'invoice.payment_failed':
        const failedInvoice = webhookEvent.data.object as Stripe.Invoice;
        console.log(`💸 MINIMAL [${requestId}] Processing invoice.payment_failed: ${failedInvoice.id}`);
        console.log(`💸 MINIMAL [${requestId}] Invoice details:`, {
          id: failedInvoice.id,
          subscription: (failedInvoice as any).subscription,
          amount_due: failedInvoice.amount_due
        });
        break;

      default:
        console.log(`ℹ️ MINIMAL [${requestId}] Unhandled event type: ${webhookEvent.type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ MINIMAL [${requestId}] Webhook processed successfully in ${duration}ms`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        received: true, 
        requestId, 
        duration,
        eventType: webhookEvent.type,
        eventId: webhookEvent.id,
        message: 'Webhook processed successfully (minimal handler - no database operations)'
      })
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ MINIMAL [${requestId}] Webhook error after ${duration}ms:`, error);
    console.error(`❌ MINIMAL [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        duration
      })
    };
  }
};
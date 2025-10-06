import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
import { PLAN_LIMITS } from '../../shared/planConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover', // Use the required API version
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  console.log(`🚀 [${requestId}] Webhook request started at ${new Date().toISOString()}`);
  console.log(`📥 [${requestId}] Event method: ${event.httpMethod}`);
  console.log(`📥 [${requestId}] Headers:`, JSON.stringify(event.headers, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Check if Stripe secret keys are configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(`❌ [${requestId}] Stripe configuration missing`);
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
    console.log(`✅ [${requestId}] OPTIONS request handled`);
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.error(`❌ [${requestId}] Invalid method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed', requestId })
    };
  }

  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!sig) {
      console.error(`❌ [${requestId}] Missing Stripe signature`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing stripe signature', requestId })
      };
    }

    console.log(`🔐 [${requestId}] Verifying webhook signature...`);
    
    // Verify webhook signature
    const webhookEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`✅ [${requestId}] Webhook signature verified`);
    console.log(`📋 [${requestId}] Event type: ${webhookEvent.type}`);
    console.log(`📋 [${requestId}] Event ID: ${webhookEvent.id}`);
    console.log(`📋 [${requestId}] Event created: ${new Date(webhookEvent.created * 1000).toISOString()}`);

    // Handle the event
    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        console.log(`🛒 [${requestId}] Processing checkout.session.completed: ${session.id}`);
        await handleCheckoutSessionCompleted(session, requestId);
        break;

      case 'customer.subscription.created':
        const createdSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🆕 [${requestId}] Processing customer.subscription.created: ${createdSubscription.id}`);
        await handleSubscriptionCreated(createdSubscription, requestId);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🔄 [${requestId}] Processing customer.subscription.updated: ${updatedSubscription.id}`);
        await handleSubscriptionUpdated(updatedSubscription, requestId);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = webhookEvent.data.object as Stripe.Subscription;
        console.log(`🗑️ [${requestId}] Processing customer.subscription.deleted: ${deletedSubscription.id}`);
        await handleSubscriptionDeleted(deletedSubscription, requestId);
        break;

      case 'invoice.payment_succeeded':
        const invoice = webhookEvent.data.object as Stripe.Invoice;
        console.log(`💰 [${requestId}] Processing invoice.payment_succeeded: ${invoice.id}`);
        await handlePaymentSucceeded(invoice, requestId);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = webhookEvent.data.object as Stripe.Invoice;
        console.log(`💸 [${requestId}] Processing invoice.payment_failed: ${failedInvoice.id}`);
        await handlePaymentFailed(failedInvoice, requestId);
        break;

      default:
        console.log(`ℹ️ [${requestId}] Unhandled event type: ${webhookEvent.type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Webhook processed successfully in ${duration}ms`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, requestId, duration })
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Webhook error after ${duration}ms:`, error);
    console.error(`❌ [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, requestId: string) {
  console.log(`🛒 [${requestId}] Checkout session completed: ${session.id}`);
  console.log(`📋 [${requestId}] Session details:`, {
    customer: session.customer,
    subscription: session.subscription,
    mode: session.mode,
    payment_status: session.payment_status,
    amount_total: session.amount_total
  });
  // TODO: Can be implemented if needed for additional checkout processing
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, requestId: string) {
  console.log(`🆕 [${requestId}] === SUBSCRIPTION CREATED HANDLER START ===`);
  const handlerStartTime = Date.now();
  
  try {
    const customerId = subscription.customer as string;
    const stripePriceId = subscription.items.data[0]?.price.id;
    
    console.log(`📋 [${requestId}] Subscription details:`, {
      id: subscription.id,
      customer: customerId,
      priceId: stripePriceId,
      status: subscription.status,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      cancel_at_period_end: (subscription as any).cancel_at_period_end
    });
    
    // Determine plan name from price ID
    const planName = getPlanFromPriceId(stripePriceId);
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
    
    console.log(`📊 [${requestId}] Plan mapping: priceId=${stripePriceId} -> planName=${planName}`);
    console.log(`📊 [${requestId}] Plan limits:`, limits);
    
    console.log(`⚠️ [${requestId}] Database operations temporarily disabled - authentication fix in progress`);
    console.log(`✅ [${requestId}] Webhook received and processed - subscription: ${subscription.id}`);
    
    const handlerDuration = Date.now() - handlerStartTime;
    console.log(`✅ [${requestId}] Subscription creation handler completed successfully in ${handlerDuration}ms for plan: ${planName}`);
    
  } catch (error) {
    const handlerDuration = Date.now() - handlerStartTime;
    console.error(`❌ [${requestId}] Error in subscription creation handler after ${handlerDuration}ms:`, error);
    console.error(`❌ [${requestId}] Handler error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
  
  console.log(`🆕 [${requestId}] === SUBSCRIPTION CREATED HANDLER END ===`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, requestId: string) {
  console.log(`🔄 [${requestId}] Subscription updated: ${subscription.id}`);
  
  try {
    const customerId = subscription.customer as string;
    const stripePriceId = subscription.items.data[0]?.price.id;
    const planName = getPlanFromPriceId(stripePriceId);
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
    
    console.log(`📊 [${requestId}] Plan mapping: priceId=${stripePriceId} -> planName=${planName}`);
    console.log(`⚠️ [${requestId}] Database operations temporarily disabled - authentication fix in progress`);
    console.log(`✅ [${requestId}] Webhook received and processed - subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error(`❌ [${requestId}] Error handling subscription updated:`, error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, requestId: string) {
  console.log(`🗑️ [${requestId}] Subscription deleted: ${subscription.id}`);
  
  try {
    const customerId = subscription.customer as string;
    
    console.log(`⚠️ [${requestId}] Database operations temporarily disabled - authentication fix in progress`);
    console.log(`✅ [${requestId}] Webhook received and processed - subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error(`❌ [${requestId}] Error handling subscription deleted:`, error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, requestId: string) {
  console.log(`💰 [${requestId}] Payment succeeded: ${invoice.id}`);
  
  try {
    const subscriptionId = (invoice as any).subscription as string;
    console.log(`📋 [${requestId}] Invoice billing reason: ${(invoice as any).billing_reason}`);
    console.log(`⚠️ [${requestId}] Database operations temporarily disabled - authentication fix in progress`);
    console.log(`✅ [${requestId}] Webhook received and processed - payment succeeded: ${invoice.id}`);
  } catch (error) {
    console.error(`❌ [${requestId}] Error handling payment succeeded:`, error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, requestId: string) {
  console.log(`💸 [${requestId}] Payment failed: ${invoice.id}`);
  
  try {
    const subscriptionId = (invoice as any).subscription as string;
    
    console.log(`⚠️ [${requestId}] Database operations temporarily disabled - authentication fix in progress`);
    console.log(`✅ [${requestId}] Webhook received and processed - payment failed: ${invoice.id}`);
  } catch (error) {
    console.error(`❌ [${requestId}] Error handling payment failed:`, error);
    throw error;
  }
}

// Helper function to map Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string | undefined): string {
  // Map your actual Stripe price IDs to plan names
  const priceMapping: Record<string, string> = {
    'price_1SEAui47Knk6vC3kvBiS86dC': 'lite',   // Monthly Lite
    'price_1SEBAA47Knk6vC3kWJNYJ4Yq': 'lite',   // Yearly Lite
    'price_1SEB5447Knk6vC3kNjJ5J5Yq': 'standard', // Monthly Standard
    'price_1SEB6647Knk6vC3kYjJYY5Yq': 'standard', // Yearly Standard
    'price_1SECQb47Knk6vC3kkvNYxIii': 'pro',    // Monthly Pro
    'price_1SECRf47Knk6vC3kaZmpEomz': 'pro',    // Yearly Pro
  };
  
  return priceMapping[priceId || ''] || 'free';
}
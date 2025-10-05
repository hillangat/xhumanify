import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use stable API version
});

// Configure client for IAM auth
const client = generateClient<Schema>({
  authMode: 'iam'
});

// Plan limits mapping
const PLAN_LIMITS: Record<string, { monthlyWordLimit: number; usageLimit: number }> = {
  'lite': { monthlyWordLimit: 20000, usageLimit: 20000 },
  'standard': { monthlyWordLimit: 50000, usageLimit: 50000 },
  'pro': { monthlyWordLimit: 150000, usageLimit: 150000 },
  'free': { monthlyWordLimit: 1500, usageLimit: 1500 }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Check if Stripe secret keys are configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Stripe configuration missing',
        details: 'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET environment variable is missing'
      })
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!sig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing stripe signature' })
      };
    }

    // Verify webhook signature
    const webhookEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook event type:', webhookEvent.type);

    // Handle the event
    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.subscription.created':
        const createdSubscription = webhookEvent.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(createdSubscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = webhookEvent.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = webhookEvent.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = webhookEvent.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = webhookEvent.data.object as Stripe.Invoice;
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  // TODO: Can be implemented if needed for additional checkout processing
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const stripePriceId = subscription.items.data[0]?.price.id;
    
    // Determine plan name from price ID
    const planName = getPlanFromPriceId(stripePriceId);
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
    
    // Find existing user subscription (could be free tier)
    const { data: existingSubscriptions } = await client.models.UserSubscription.list({
      filter: {
        or: [
          { stripeCustomerId: { eq: customerId } },
          { stripeCustomerId: { eq: 'free-tier-user' } }
        ]
      }
    });
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Update existing subscription (preserve current usage in current billing cycle)
      const existingSub = existingSubscriptions[0];
      
      await client.models.UserSubscription.update({
        id: existingSub.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: stripePriceId,
        status: subscription.status as any,
        planName: planName,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        usageLimit: limits.usageLimit,
        // Keep existing usageCount - don't reset until next billing cycle
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new subscription record
      await client.models.UserSubscription.create({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: stripePriceId,
        status: subscription.status as any,
        planName: planName,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        usageCount: 0, // New subscription starts fresh
        usageLimit: limits.usageLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log(`Subscription created for plan: ${planName}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const stripePriceId = subscription.items.data[0]?.price.id;
    const planName = getPlanFromPriceId(stripePriceId);
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['free'];
    
    // Find existing subscription
    const { data: existingSubscriptions } = await client.models.UserSubscription.list({
      filter: {
        stripeCustomerId: { eq: customerId }
      }
    });
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSub = existingSubscriptions[0];
      
      // Check if this is a plan change or renewal
      const oldPlanName = existingSub.planName;
      const isRenewal = oldPlanName === planName;
      
      await client.models.UserSubscription.update({
        id: existingSub.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: stripePriceId,
        status: subscription.status as any,
        planName: planName,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        usageLimit: limits.usageLimit,
        // Reset usage only on renewal or upgrade, not on downgrades
        usageCount: isRenewal ? 0 : existingSub.usageCount,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Subscription updated: ${oldPlanName} -> ${planName}, renewal: ${isRenewal}`);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    
    // Find existing subscription
    const { data: existingSubscriptions } = await client.models.UserSubscription.list({
      filter: {
        stripeCustomerId: { eq: customerId }
      }
    });
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSub = existingSubscriptions[0];
      
      // Revert to free tier but PRESERVE current usage count
      await client.models.UserSubscription.update({
        id: existingSub.id,
        stripeCustomerId: 'free-tier-user', // Revert to free tier marker
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
        status: undefined, // No active paid subscription
        planName: 'free',
        currentPeriodStart: undefined,
        currentPeriodEnd: undefined,
        cancelAtPeriodEnd: false,
        usageLimit: PLAN_LIMITS['free'].usageLimit,
        // CRITICAL: Keep existing usage count - don't reset!
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Subscription cancelled, reverted to free tier with preserved usage: ${existingSub.usageCount}/${PLAN_LIMITS['free'].usageLimit}`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  try {
    // Only reset usage on recurring payments (not one-time charges)
    if ((invoice as any).billing_reason === 'subscription_cycle') {
      const subscriptionId = (invoice as any).subscription as string;
      
      if (subscriptionId) {
        // Find subscription by Stripe subscription ID
        const { data: subscriptions } = await client.models.UserSubscription.list({
          filter: {
            stripeSubscriptionId: { eq: subscriptionId }
          }
        });
        
        if (subscriptions && subscriptions.length > 0) {
          const subscription = subscriptions[0];
          
          // Reset usage count for new billing cycle
          await client.models.UserSubscription.update({
            id: subscription.id,
            usageCount: 0, // Fresh start for new billing cycle
            updatedAt: new Date().toISOString()
          });
          
          console.log(`Usage reset for subscription ${subscriptionId} - new billing cycle`);
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  try {
    const subscriptionId = (invoice as any).subscription as string;
    
    if (subscriptionId) {
      // Find subscription by Stripe subscription ID
      const { data: subscriptions } = await client.models.UserSubscription.list({
        filter: {
          stripeSubscriptionId: { eq: subscriptionId }
        }
      });
      
      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0];
        
        // Mark subscription as past due but don't immediately downgrade
        await client.models.UserSubscription.update({
          id: subscription.id,
          status: 'past_due',
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Payment failed for subscription ${subscriptionId} - marked as past due`);
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
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
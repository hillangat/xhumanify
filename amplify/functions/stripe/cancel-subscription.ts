import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
});

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Cancel subscription request:', JSON.stringify(event, null, 2));

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const { subscriptionId } = JSON.parse(event.body || '{}');

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing subscriptionId in request body'
        })
      };
    }

    console.log('Canceling subscription:', subscriptionId);

    // First, retrieve the subscription to ensure it exists and get customer info
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Subscription not found'
        })
      };
    }

    // Cancel the subscription immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: true
    });

    console.log('Subscription canceled:', canceledSubscription.id);

    // Optionally delete the customer if this was their only subscription
    const customerId = subscription.customer as string;
    
    // Get all subscriptions for this customer
    const customerSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });

    // If no active subscriptions remain, we could delete the customer
    // but it's safer to keep the customer record for audit purposes
    if (customerSubscriptions.data.length === 0) {
      console.log(`Customer ${customerId} has no active subscriptions remaining`);
      
      // Optionally, you could delete the customer:
      // await stripe.customers.del(customerId);
      // console.log('Customer deleted:', customerId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          canceled_at: canceledSubscription.canceled_at,
          current_period_end: (canceledSubscription as any).current_period_end || null
        },
        message: 'Subscription canceled successfully'
      })
    };

  } catch (error) {
    console.error('Error canceling subscription:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = error instanceof Stripe.errors.StripeError ? 400 : 500;

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: 'Failed to cancel subscription',
        details: errorMessage
      })
    };
  }
};
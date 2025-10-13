import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
// @ts-ignore
import { env } from '$amplify/env/createCheckoutSession';

console.log('🚀 CHECKOUT SESSION: Module loading started');

// Environment variables accessed through generated env object (same pattern as webhook)
console.log('🔍 CHECKOUT SESSION: Environment check:', {
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ? 'SET' : 'NOT_SET'
});

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check if Stripe secret key is configured
  if (!env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Stripe secret key not configured',
        details: 'STRIPE_SECRET_KEY environment variable is missing'
      })
    };
  }

  try {
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const { priceId, userId, userEmail } = JSON.parse(event.body);

    console.log('Received parameters:', { priceId, userId, userEmail });

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing priceId parameter' })
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId parameter' })
      };
    }

    if (!userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userEmail parameter' })
      };
    }

    console.log('Creating Stripe checkout session...');

    // First, try to find existing customer by email
    let customerId: string | undefined;
    try {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        customerId = customer.id;
        
        // Update customer metadata with userId if not set
        if (!customer.metadata?.userId || customer.metadata.userId !== userId) {
          await stripe.customers.update(customerId, {
            metadata: {
              userId: userId,
            },
          });
          console.log(`Updated customer ${customerId} with userId ${userId}`);
        }
      }
    } catch (customerError) {
      console.warn('Error checking for existing customer:', customerError);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Use existing customer if found
      customer_email: customerId ? undefined : userEmail, // Only set email if no customer ID
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `https://www.humanizeaicontents.com/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.humanizeaicontents.com/upgrade?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      customer_creation: customerId ? undefined : 'always',
      customer_update: customerId ? {
        metadata: 'update',
      } : undefined,
    });

    console.log('Checkout session created successfully:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      })
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
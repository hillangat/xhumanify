import type { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
// @ts-ignore
import { env } from '$amplify/env/createPortalSession';

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  console.log('Portal session request received:', {
    method: event.httpMethod,
    body: event.body,
    headers: event.headers
  });

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
    const requestBody = JSON.parse(event.body || '{}');
    const { customerId } = requestBody;

    console.log('Parsed request body:', { customerId });

    if (!customerId) {
      console.error('Customer ID missing in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' })
      };
    }

    console.log('Creating portal session for customer:', customerId);

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.humanizeaicontents.com'}/upgrade`,
    });

    console.log('Portal session created successfully:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: session.url 
      })
    };

  } catch (error) {
    console.error('Error creating portal session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      customerId: event.body ? JSON.parse(event.body).customerId : 'N/A'
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
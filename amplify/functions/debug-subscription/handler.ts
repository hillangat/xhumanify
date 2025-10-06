import type { APIGatewayProxyHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

// Lazy initialization to avoid module load time errors
let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    console.log('🔧 Initializing GraphQL client for debug subscription...');
    client = generateClient<Schema>({
      authMode: 'userPool'
    });
  }
  return client;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://www.humanizeaicontents.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const client = getClient();
    
    // Get all user subscriptions for debugging
    const { data: subscriptions } = await client.models.UserSubscription.list();
    
    // Get recent usage tracking records
    const { data: usageRecords } = await client.models.UsageTracking.list({
      limit: 10
    });

    const debugInfo = {
      timestamp: new Date().toISOString(),
      totalSubscriptions: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(sub => ({
        id: sub.id,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        status: sub.status,
        planName: sub.planName,
        usageCount: sub.usageCount,
        usageLimit: sub.usageLimit,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })) || [],
      recentUsage: usageRecords?.map(usage => ({
        id: usage.id,
        operation: usage.operation,
        tokensUsed: usage.tokensUsed,
        success: usage.success,
        timestamp: usage.timestamp
      })) || []
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debugInfo, null, 2)
    };

  } catch (error) {
    console.error('Debug subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to debug subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
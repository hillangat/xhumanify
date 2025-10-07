import type { APIGatewayProxyHandler } from 'aws-lambda';

console.log('SUPER MINIMAL: Module loading started');

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('SUPER MINIMAL: Handler called');
  console.log('SUPER MINIMAL: Event method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('SUPER MINIMAL: OPTIONS handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  console.log('SUPER MINIMAL: Returning success');
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      success: true, 
      message: 'Super minimal webhook handler working',
      timestamp: new Date().toISOString(),
      method: event.httpMethod
    })
  };
};

console.log('SUPER MINIMAL: Module loaded completely');
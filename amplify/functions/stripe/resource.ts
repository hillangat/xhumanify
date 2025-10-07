import { defineFunction, secret } from '@aws-amplify/backend';

export const createCheckoutSession = defineFunction({
  name: 'createCheckoutSession',
  entry: './create-checkout-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY')
  }
});

export const createPortalSession = defineFunction({
  name: 'createPortalSession', 
  entry: './create-portal-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY')
  }
});

export const handleWebhook = defineFunction({
  name: 'handleWebhook',
  entry: './webhook-handler-fixed.ts', // Using the working fixed version
  timeoutSeconds: 60, // Increased from default 3 seconds to handle complex webhook processing
  memoryMB: 512,
  resourceGroupName: 'data', // Assign to data stack to resolve circular dependency
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: secret('STRIPE_WEBHOOK_SECRET')
  }
});

// Monthly usage reset function for free tier users
export const monthlyUsageReset = defineFunction({
  name: 'monthlyUsageReset',
  entry: './monthly-usage-reset.ts',
  environment: {}
});
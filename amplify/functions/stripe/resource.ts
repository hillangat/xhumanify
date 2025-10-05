import { defineFunction } from '@aws-amplify/backend';

export const createCheckoutSession = defineFunction({
  name: 'createCheckoutSession',
  entry: './create-checkout-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512
});

export const createPortalSession = defineFunction({
  name: 'createPortalSession', 
  entry: './create-portal-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512
});

export const handleWebhook = defineFunction({
  name: 'handleWebhook',
  entry: './webhook-handler.ts',
  timeoutSeconds: 60, // Increased from default 3 seconds to handle complex webhook processing
  memoryMB: 512
});

// Monthly usage reset function for free tier users
export const monthlyUsageReset = defineFunction({
  name: 'monthlyUsageReset',
  entry: './monthly-usage-reset.ts',
  environment: {}
});
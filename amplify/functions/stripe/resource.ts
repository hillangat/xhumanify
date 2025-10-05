import { defineFunction } from '@aws-amplify/backend';

export const createCheckoutSession = defineFunction({
  name: 'createCheckoutSession',
  entry: './create-checkout-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || ''
  }
});

export const createPortalSession = defineFunction({
  name: 'createPortalSession', 
  entry: './create-portal-session.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || ''
  }
});

export const handleWebhook = defineFunction({
  name: 'handleWebhook',
  entry: './webhook-handler.ts',
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || ''
  }
});

// Monthly usage reset function for free tier users
export const monthlyUsageReset = defineFunction({
  name: 'monthlyUsageReset',
  entry: './monthly-usage-reset.ts',
  environment: {}
});
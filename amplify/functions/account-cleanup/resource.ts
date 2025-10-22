import { defineFunction } from '@aws-amplify/backend';

export const accountCleanup = defineFunction({
  entry: './handler.ts',
  name: 'account-cleanup',
  timeoutSeconds: 60,
});
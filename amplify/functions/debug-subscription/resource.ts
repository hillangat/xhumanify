import { defineFunction } from '@aws-amplify/backend';

export const debugSubscription = defineFunction({
  name: 'debugSubscription',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data' // Assign to data stack since it accesses GraphQL
});
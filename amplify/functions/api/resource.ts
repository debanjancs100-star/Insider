import { defineFunction } from '@aws-amplify/backend';

export const api = defineFunction({
  name: 'insider-api',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 15,
  memoryMB: 256,
  // Same stack as the data resources avoids a circular dependency (resolver <-> table grants).
  resourceGroupName: 'data',
  environment: {
    // 'test' enables the instant-activation stand-in for billing. Leave unset in production.
    BILLING_MODE: process.env.BILLING_MODE ?? 'disabled',
  },
});

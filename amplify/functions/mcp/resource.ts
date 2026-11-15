import { defineFunction } from '@aws-amplify/backend';

export const mcp = defineFunction({
  name: 'insider-mcp',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 20,
  memoryMB: 256,
  resourceGroupName: 'data',
});

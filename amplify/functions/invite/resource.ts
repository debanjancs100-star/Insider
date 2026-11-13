import { defineFunction, secret } from '@aws-amplify/backend';

export const invite = defineFunction({
  name: 'insider-invite',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 15,
  resourceGroupName: 'data',
  environment: { DEVELOPER_INVITE_CODE: secret('DEVELOPER_INVITE_CODE') },
});

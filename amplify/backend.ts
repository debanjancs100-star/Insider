import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { api } from './functions/api/resource';
import { invite } from './functions/invite/resource';
import { mcp } from './functions/mcp/resource';

const backend = defineBackend({ auth, data, storage, api, invite, mcp });
const tables = backend.data.resources.tables;
const { userPool, userPoolClient } = backend.auth.resources;

// ---- storage: configure S3 bucket CORS for 3D models and images ----
const s3Bucket = backend.storage.resources.bucket;
const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;
if (cfnBucket) {
  cfnBucket.corsConfiguration = {
    corsRules: [
      {
        allowedHeaders: ['*'],
        allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowedOrigins: ['*'],
        exposedHeaders: [
          'x-amz-server-side-encryption',
          'x-amz-request-id',
          'x-amz-id-2',
          'ETag',
        ],
        maxAge: 3000,
      },
    ],
  };
}

// ---- api: read projects/profiles, write subscriptions ----
tables['Project'].grantReadData(backend.api.resources.lambda);
tables['Profile'].grantReadData(backend.api.resources.lambda);
tables['UserSubscription'].grantWriteData(backend.api.resources.lambda);
backend.api.addEnvironment('PROJECT_TABLE', tables['Project'].tableName);
backend.api.addEnvironment('PROFILE_TABLE', tables['Profile'].tableName);
backend.api.addEnvironment('SUBSCRIPTION_TABLE', tables['UserSubscription'].tableName);

// ---- invite: manage Cognito groups ----
backend.invite.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:CreateGroup', 'cognito-idp:AdminAddUserToGroup'],
    resources: [userPool.userPoolArn],
  }),
);
backend.invite.addEnvironment('USER_POOL_ID', userPool.userPoolId);

// ---- mcp: public Function URL, bearer JWT verified in code ----
tables['Project'].grantReadWriteData(backend.mcp.resources.lambda);
tables['Profile'].grantReadData(backend.mcp.resources.lambda);
backend.mcp.addEnvironment('PROJECT_TABLE', tables['Project'].tableName);
backend.mcp.addEnvironment('PROFILE_TABLE', tables['Profile'].tableName);
backend.mcp.addEnvironment('USER_POOL_ID', userPool.userPoolId);
backend.mcp.addEnvironment('USER_POOL_CLIENT_ID', userPoolClient.userPoolClientId);

const mcpUrl = backend.mcp.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: { allowedOrigins: ['*'], allowedMethods: [HttpMethod.ALL], allowedHeaders: ['*'] },
});
backend.addOutput({ custom: { mcpUrl: mcpUrl.url } });

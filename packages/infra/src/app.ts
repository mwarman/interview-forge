import * as cdk from 'aws-cdk-lib';

import { getConfig, getEnvironmentConfig, getTags } from './utils/config.js';
import { DataStack } from './stacks/data-stack.js';
import { BackendStack } from './stacks/backend-stack.js';

/**
 * Main CDK application entry point
 * Loads configuration and instantiates all stacks
 */
const app = new cdk.App();

// Load and validate configuration
const config = getConfig();

// Get AWS environment configuration (account and region)
const env = getEnvironmentConfig(config);

// Get AWS tags from config for organizational tagging
const tags = getTags(config);

// Instantiate the data stack (DynamoDB, S3, etc.)
const dataStack = new DataStack(app, 'DataStack', {
  stackName: `${config.CDK_APP_NAME}-data-stack-${config.CDK_ENV_NAME}`,
  description: `Data layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  config,
  env,
  tags,
});

// Instantiate the backend stack (API Gateway, Lambda, etc.)
const backendStack = new BackendStack(app, 'BackendStack', {
  stackName: `${config.CDK_APP_NAME}-backend-stack-${config.CDK_ENV_NAME}`,
  description: `Backend layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  config,
  env,
  tags,
  table: dataStack.table,
  bucket: dataStack.bucket,
});

// Set stack dependencies (backend depends on data)
backendStack.addDependency(dataStack);

// Synthesize the CloudFormation templates
app.synth();

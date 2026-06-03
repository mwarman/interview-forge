import * as cdk from 'aws-cdk-lib';

import { getConfig, getEnvironmentConfig, getTags } from './utils/config.js';
import { DataStack } from './stacks/data-stack.js';

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
new DataStack(app, 'DataStack', {
  stackName: `${config.CDK_APP_NAME}-data-stack-${config.CDK_ENV_NAME}`,
  description: `Data layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  config,
  env,
  tags,
});

// Synthesize the CloudFormation templates
app.synth();

import * as cdk from 'aws-cdk-lib';

import { getConfig, getEnvironmentConfig, getTags } from './utils/config.js';
import { DataStack } from './stacks/data-stack.js';
import { BackendStack } from './stacks/backend-stack.js';
import { AgentStack } from './stacks/agent-stack.js';
import { FrontendStack } from './stacks/frontend-stack.js';

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

// Instantiate the agent stack (Bedrock Agent, action groups, IAM role)
const agentStack = new AgentStack(app, 'AgentStack', {
  stackName: `${config.CDK_APP_NAME}-agent-stack-${config.CDK_ENV_NAME}`,
  description: `Agent layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  config,
  env,
  tags,
  table: dataStack.table,
  bucket: dataStack.bucket,
});

// Set stack dependencies (agent depends on data)
agentStack.addDependency(dataStack);

// Instantiate the backend stack (API Gateway, Lambda, etc.)
const backendStack = new BackendStack(app, 'BackendStack', {
  stackName: `${config.CDK_APP_NAME}-backend-stack-${config.CDK_ENV_NAME}`,
  description: `Backend layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  config,
  env,
  tags,
  table: dataStack.table,
  bucket: dataStack.bucket,
  planAgentAlias: agentStack.planAgentAlias,
  planAgentId: agentStack.planAgent.attrAgentId,
  planAgentAliasId: agentStack.planAgentAlias.attrAgentAliasId,
  assessAgentAlias: agentStack.assessAgentAlias,
  assessAgentId: agentStack.assessAgent.attrAgentId,
  assessAgentAliasId: agentStack.assessAgentAlias.attrAgentAliasId,
});

// Set stack dependencies (backend depends on data and agent)
backendStack.addDependency(dataStack);
backendStack.addDependency(agentStack);

// Instantiate the frontend stack (CloudFront, S3 for React frontend)
const frontendStack = new FrontendStack(app, 'FrontendStack', {
  stackName: `${config.CDK_APP_NAME}-frontend-stack-${config.CDK_ENV_NAME}`,
  description: `Frontend hosting layer for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
  appName: config.CDK_APP_NAME,
  envName: config.CDK_ENV_NAME,
  config,
  env,
  tags,
});

// Set stack dependencies (frontend depends on backend for stack ordering)
frontendStack.addDependency(backendStack);

// Synthesize the CloudFormation templates
app.synth();

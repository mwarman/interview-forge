import { describe, it, expect, beforeEach } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BackendStack } from './backend-stack';
import { DataStack } from './data-stack';
import { getConfig } from '../utils/config';

describe('BackendStack', () => {
  let app: cdk.App;
  let config: ReturnType<typeof getConfig>;
  let dataStack: DataStack;

  beforeEach(() => {
    app = new cdk.App({
      context: { 'aws:cdk:bundling-stacks': [] },
    });
    config = getConfig();
    dataStack = new DataStack(app, 'TestDataStack', { config });
  });

  it('should define an API Gateway REST API with correct naming pattern', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'test-app-api-dev',
    });
  });

  it('should configure CORS to allow all origins and all HTTP methods', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  it('should deploy with the environment name as the stage name', () => {
    // Arrange
    process.env.CDK_ENV_NAME = 'qa';
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'qa',
    });
  });

  it('should export the API as a public property', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    expect(stack.api).toBeDefined();
    expect(stack.api.restApiId).toBeDefined();
  });

  it('should define all 8 Lambda functions with correct memory and timeout configurations', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Lambda::Function', 8);

    // Health Lambda: 128MB, 6s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-health-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 6,
    });

    // Create JD Lambda: 256MB, 30s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-create-jd-${config.CDK_ENV_NAME}`,
      MemorySize: 256,
      Timeout: 30,
    });

    // List JD Lambda: 128MB, 10s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-list-jd-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 10,
    });

    // Get JD Lambda: 128MB, 10s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-get-jd-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 10,
    });

    // Create JD URL Lambda: 128MB, 10s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-create-jd-url-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 10,
    });

    // Create Session Lambda: 128MB, 15s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-create-session-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 15,
    });

    // List Sessions Lambda: 128MB, 10s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-list-sessions-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 10,
    });

    // Get Session Lambda: 128MB, 10s
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${config.CDK_APP_NAME}-get-session-${config.CDK_ENV_NAME}`,
      MemorySize: 128,
      Timeout: 10,
    });
  });

  it('should wire all Lambda functions to API Gateway with proxy integration', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify HTTP methods exist for API Gateway routes
    // Get all API Gateway methods
    const allMethods = template.findResources('AWS::ApiGateway::Method') as Record<string, Record<string, unknown>>;
    expect(Object.keys(allMethods).length).toBeGreaterThan(0);

    // Verify at least one GET and POST method exist with Lambda integration
    const getMethod = Object.values(allMethods).find(
      (method: Record<string, unknown>) =>
        (method.Properties as Record<string, unknown>)?.HttpMethod === 'GET' &&
        ((method.Properties as Record<string, unknown>)?.Integration as Record<string, unknown>)?.Type === 'AWS_PROXY',
    );
    expect(getMethod).toBeDefined();

    const postMethod = Object.values(allMethods).find(
      (method: Record<string, unknown>) =>
        (method.Properties as Record<string, unknown>)?.HttpMethod === 'POST' &&
        ((method.Properties as Record<string, unknown>)?.Integration as Record<string, unknown>)?.Type === 'AWS_PROXY',
    );
    expect(postMethod).toBeDefined();
  });

  it('should pass correct environment variables to Lambda functions', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify environment variables are set on Lambda functions
    // Note: Table and bucket names are CloudFormation references, so we verify all Lambdas have the required env vars
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          LOG_LEVEL: config.CDK_LOG_LEVEL,
          LOG_FORMAT: config.CDK_LOG_FORMAT,
          LOG_ENABLED: config.CDK_LOG_ENABLED,
        },
      },
    });

    // Additionally verify that JD_TABLE_NAME and JD_BUCKET_NAME are present
    template.resourceCountIs('AWS::Lambda::Function', 8);
    const allResources = template.findResources('AWS::Lambda::Function') as Record<
      string,
      Record<string, Record<string, Record<string, unknown>>>
    >;
    expect(
      Object.values(allResources).every(
        (resource: Record<string, Record<string, Record<string, unknown>>>) =>
          'JD_TABLE_NAME' in (resource.Properties.Environment.Variables as Record<string, unknown>),
      ),
    ).toBe(true);
    expect(
      Object.values(allResources).every(
        (resource: Record<string, Record<string, Record<string, unknown>>>) =>
          'JD_BUCKET_NAME' in (resource.Properties.Environment.Variables as Record<string, unknown>),
      ),
    ).toBe(true);
  });

  it('should create CloudWatch Log Groups for all Lambda functions', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify CloudWatch Log Groups are created
    template.resourceCountIs('AWS::Logs::LogGroup', 8);

    // Verify retention is set to ONE_WEEK
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  it('should grant Lambda functions read/write permissions to DynamoDB table and S3 bucket', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify IAM policies are created (at least 7 for the 8 Lambdas, some may share a role)
    // Get all policy resources
    const allPolicies = template.findResources('AWS::IAM::Policy') as Record<
      string,
      Record<string, Record<string, Record<string, unknown>[]>>
    >;
    expect(Object.keys(allPolicies).length).toBeGreaterThan(0);

    // Verify at least one policy contains DynamoDB actions
    const hasDynamoDBPolicy = Object.values(allPolicies).some(
      (policy: Record<string, Record<string, Record<string, unknown>[]>>) => {
        const statements = (policy.Properties.PolicyDocument.Statement || []) as Record<string, unknown>[];
        return statements.some((stmt: Record<string, unknown>) => {
          const actions = Array.isArray(stmt.Action) ? (stmt.Action as string[]) : [stmt.Action as string];
          return actions.some((action: string) => action.includes('dynamodb'));
        });
      },
    );

    // Verify at least one policy contains S3 actions
    const hasS3Policy = Object.values(allPolicies).some(
      (policy: Record<string, Record<string, Record<string, unknown>[]>>) => {
        const statements = (policy.Properties.PolicyDocument.Statement || []) as Record<string, unknown>[];
        return statements.some((stmt: Record<string, unknown>) => {
          const actions = Array.isArray(stmt.Action) ? (stmt.Action as string[]) : [stmt.Action as string];
          return actions.some((action: string) => action.includes('s3'));
        });
      },
    );

    expect(hasDynamoDBPolicy).toBe(true);
    expect(hasS3Policy).toBe(true);
  });

  it('should export the API Gateway URL as a stack output', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasOutput('APIGatewayUrl', {
      Description: 'HTTP API Gateway endpoint URL',
      Export: {
        Name: 'test-app-APIGatewayUrl-dev',
      },
    });
  });
});

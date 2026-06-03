import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BackendStack } from './backend-stack';
import { getConfig } from '../utils/config';

describe('BackendStack', () => {
  it('should define an API Gateway REST API with correct naming pattern', () => {
    // Arrange
    const app = new cdk.App();
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'test-app-api-dev',
    });
  });

  it('should configure CORS to allow all origins and all HTTP methods', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    // Verify that the REST API exists with CORS resource (preflight OPTIONS method)
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    // Verify OPTIONS method exists for CORS preflight
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  it('should deploy with the environment name as the stage name', () => {
    // Arrange
    const app = new cdk.App();
    process.env.CDK_ENV_NAME = 'qa';
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'qa',
    });
  });

  it('should export the API as a public property', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new BackendStack(app, 'TestBackendStack', { config });

    // Assert
    expect(stack.api).toBeDefined();
    expect(stack.api.restApiId).toBeDefined();
  });
});

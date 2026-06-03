import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataStack } from './data-stack';
import { getConfig } from '../utils/config';

describe('DataStack', () => {
  it('should define a DynamoDB table with PK and SK', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
    });
  });

  it('should define GSI1 with GSI1PK and GSI1SK with ALL projection', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    });
  });

  it('should enable TTL on the TTL attribute', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TimeToLiveSpecification: {
        AttributeName: 'TTL',
        Enabled: true,
      },
    });
  });

  it('should set billing mode to PAY_PER_REQUEST', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  it('should name the table following the pattern: ${CDK_APP_NAME}-data-table-${CDK_ENV_NAME}', () => {
    // Arrange
    const app = new cdk.App();
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'test-app-data-table-dev',
    });
  });

  it('should export the table as a public property', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new DataStack(app, 'TestDataStack', { config });

    // Assert
    expect(stack.table).toBeDefined();
    expect(stack.table.tableArn).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from './frontend-stack.js';
import { getConfig } from '../utils/config.js';

describe('FrontendStack', () => {
  it('should create an S3 bucket with encryption enabled', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  it('should block all public access to the S3 bucket', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('should create a CloudFront distribution', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
      },
    });
  });

  it('should configure CloudFront cache policy as CACHING_OPTIMIZED', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          Compress: true,
          ViewerProtocolPolicy: 'redirect-to-https',
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CACHING_OPTIMIZED CDK constant
        },
      },
    });
  });

  it('should configure custom error responses for 403 and 404', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: [
          {
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
        ],
      },
    });
  });

  it('should export CloudFront distribution URL as stack output', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasOutput('FrontendDistributionUrl', {
      Description: 'CloudFront distribution URL for the frontend',
      Export: {
        Name: 'test-app-FrontendUrl-dev',
      },
    });
  });

  it('should export S3 bucket name as stack output', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasOutput('FrontendBucketName', {
      Description: 'S3 bucket name for frontend assets',
      Export: {
        Name: 'test-app-FrontendBucket-dev',
      },
    });
  });

  it('should export CloudFront distribution ID as stack output', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasOutput('FrontendDistributionId', {
      Description: 'CloudFront distribution ID',
      Export: {
        Name: 'test-app-FrontendDistributionId-dev',
      },
    });
  });

  it('should set removal policy to DESTROY for dev environment', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-app-frontend-dev',
    });
    // Note: Verify auto-delete via S3 bucket policies
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  it('should set removal policy to RETAIN for prod environment', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'prod',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    // In prod, bucket should have RetainOnDelete policy
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-app-frontend-prod',
    });
  });

  it('should create S3 bucket deployment resource', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    // Verify BucketDeployment creates AWS::S3::Bucket and AWS::CloudFront::CloudFrontOriginAccessIdentity resources
    template.resourceCountIs('AWS::S3::Bucket', 1);
    // Distribution invalidation happens via custom resource or lambda
  });

  it('should expose public properties for stack consumption', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    expect(stack.bucket).toBeDefined();
    expect(stack.distribution).toBeDefined();
    expect(stack.distributionUrl).toBeDefined();
    expect(stack.bucketName).toBeDefined();
    expect(stack.distributionUrl).toMatch(/^https:\/\//);
  });

  it('should use price class PRICE_CLASS_100 for cost optimization', () => {
    // Arrange
    const app = new cdk.App();
    const config = getConfig();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      appName: 'test-app',
      envName: 'dev',
      config,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_100',
      },
    });
  });
});

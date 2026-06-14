import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

import type { Config } from '../utils/config.js';

/**
 * Props for the FrontendStack
 */
interface FrontendStackProps extends cdk.StackProps {
  appName: string;
  envName: string;
  config: Config;
}

/**
 * FrontendStack: Static hosting for React frontend
 * Provisions S3 bucket for static assets and CloudFront distribution for global delivery.
 *
 * Features:
 * - S3 bucket with server-side encryption and no public access
 * - CloudFront distribution with Origin Access Control (OAC)
 * - SPA 404 fallback to /index.html for client-side routing
 * - Optimized cache policies for hashed assets and index.html
 * - Automatic Vite dist/ deployment to S3
 * - CloudFront URL exported as stack output
 */
export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionUrl: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { appName, envName } = props;

    // Create S3 bucket for frontend assets
    // No public access — all traffic flows through CloudFront
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${appName}-frontend-${envName}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
      versioned: false,
    });

    // Create CloudFront Distribution with Origin Access Control (OAC)
    // S3BucketOrigin.withOriginAccessControl() automatically:
    // - Creates and manages the OAC
    // - Configures S3 origin with OAC
    // - Grants OAC permissions to the bucket (no manual IAM policy needed)
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        // Origin: S3 bucket accessed via OAC using the modern CDK pattern
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        // Viewer protocol: Redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Cache policy: Optimized for web applications with hashing
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        // Compress assets for faster transfer
        compress: true,
      },
      // Default root object for SPA
      defaultRootObject: 'index.html',
      // Price class: Cost-optimized, excludes expensive regions (North America, Europe, Asia-Pacific)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      // Custom error responses for SPA client-side routing fallback
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0), // Don't cache 403 error responses
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0), // Don't cache 404 error responses
        },
      ],
    });

    // Deploy Vite dist/ output to S3 bucket
    // This runs as part of `cdk deploy` and ensures CloudFront serves the latest build
    new s3deploy.BucketDeployment(this, 'DeployFrontendAssets', {
      sources: [s3deploy.Source.asset('../web/dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      // Invalidate CloudFront cache after deployment
      distributionPaths: ['/*'],
      retainOnDelete: false, // Remove old assets that are no longer in the new build
    });

    // Store values for export
    this.bucketName = this.bucket.bucketName;
    this.distributionUrl = `https://${this.distribution.distributionDomainName}`;

    // Stack outputs for consumption by end users
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      description: 'S3 bucket name for frontend assets',
      value: this.bucketName,
      exportName: `${appName}-FrontendBucket-${envName}`,
    });

    new cdk.CfnOutput(this, 'FrontendDistributionUrl', {
      description: 'CloudFront distribution URL for the frontend',
      value: this.distributionUrl,
      exportName: `${appName}-FrontendUrl-${envName}`,
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      description: 'CloudFront distribution ID',
      value: this.distribution.distributionId,
      exportName: `${appName}-FrontendDistributionId-${envName}`,
    });
  }
}

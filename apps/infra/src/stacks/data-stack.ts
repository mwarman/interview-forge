import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import type { Config } from '../utils/config.js';

/**
 * Props for the DataStack
 */
interface DataStackProps extends cdk.StackProps {
  config: Config;
}

/**
 * DataStack: Stateful resources including DynamoDB single-table design
 * This stack contains all persistent data storage resources.
 */
export class DataStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Create the DynamoDB table with single-table design
    this.table = new dynamodb.Table(this, 'DataTable', {
      tableName: `${config.CDK_APP_NAME}-data-table-${config.CDK_ENV_NAME}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroy on stack deletion (safe for dev/qa)
      timeToLiveAttribute: 'TTL', // Enable TTL on TTL attribute
    });

    // Add GSI1 for secondary access patterns
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create the S3 bucket for JD file upload staging
    this.bucket = new s3.Bucket(this, 'JdUploadsBucket', {
      bucketName: `${config.CDK_APP_NAME}-jd-uploads-${config.CDK_ENV_NAME}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroy on stack deletion (safe for dev/qa)
      autoDeleteObjects: true, // Automatically delete objects when bucket is destroyed
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // Allow from any origin (can be restricted in production)
          allowedHeaders: ['*'], // Allow all headers
          maxAge: 3000, // Cache preflight response for 50 minutes
        },
      ],
    });

    // Add 72-hour lifecycle rule for automatic expiration of staged JD files
    this.bucket.addLifecycleRule({
      id: 'ExpireJdFilesAfter72Hours',
      enabled: true,
      expiration: cdk.Duration.hours(72),
    });
  }
}

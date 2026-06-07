import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'path';

import type { Config } from '../utils/config.js';

/**
 * Props for the BackendStack
 */
interface BackendStackProps extends cdk.StackProps {
  config: Config;
  table: dynamodb.Table;
  bucket: s3.Bucket;
}

/**
 * BackendStack: API and compute resources
 * This stack contains all API Gateway and Lambda resources.
 */
export class BackendStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly readJdActionLambda: NodejsFunction;
  public readonly writePlanActionLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { config, table, bucket } = props;

    // Create shared Lambda environment variables
    const lambdaEnvironment = {
      LOG_LEVEL: config.CDK_LOG_LEVEL,
      LOG_FORMAT: config.CDK_LOG_FORMAT,
      LOG_ENABLED: config.CDK_LOG_ENABLED,
      JD_TABLE_NAME: table.tableName,
      JD_BUCKET_NAME: bucket.bucketName,
    };

    // Create the API Gateway REST API with CORS enabled
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${config.CDK_APP_NAME}-api-${config.CDK_ENV_NAME}`,
      description: `REST API for ${config.CDK_APP_NAME} (${config.CDK_ENV_NAME})`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: config.CDK_ENV_NAME,
      },
    });

    // Health Check Lambda Function using NodejsFunction for esbuild bundling
    const healthLambda = new NodejsFunction(this, 'HealthFunction', {
      functionName: `${config.CDK_APP_NAME}-health-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/health/health.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(6),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'HealthFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-health-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Create Job Description Lambda Function
    const createJdLambda = new NodejsFunction(this, 'CreateJdFunction', {
      functionName: `${config.CDK_APP_NAME}-create-jd-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/create-jd-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'CreateJdFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-create-jd-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to CreateJdLambda
    table.grantReadWriteData(createJdLambda);
    bucket.grantReadWrite(createJdLambda);

    // List Job Descriptions Lambda Function
    const listJdLambda = new NodejsFunction(this, 'ListJdFunction', {
      functionName: `${config.CDK_APP_NAME}-list-jd-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/list-jd-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'ListJdFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-list-jd-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to ListJdLambda
    table.grantReadData(listJdLambda);

    // Get Job Description Lambda Function
    const getJdLambda = new NodejsFunction(this, 'GetJdFunction', {
      functionName: `${config.CDK_APP_NAME}-get-jd-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/get-jd-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'GetJdFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-get-jd-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to GetJdLambda
    table.grantReadData(getJdLambda);

    // Create JD Upload URL Lambda Function
    const createJdUrlLambda = new NodejsFunction(this, 'CreateJdUrlFunction', {
      functionName: `${config.CDK_APP_NAME}-create-jd-url-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/create-jd-url-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'CreateJdUrlFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-create-jd-url-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to CreateJdUrlLambda
    bucket.grantPut(createJdUrlLambda);

    // Create Session Lambda Function
    const createSessionLambda = new NodejsFunction(this, 'CreateSessionFunction', {
      functionName: `${config.CDK_APP_NAME}-create-session-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/session/create-session-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'CreateSessionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-create-session-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to CreateSessionLambda
    table.grantReadWriteData(createSessionLambda);

    // List Sessions Lambda Function
    const listSessionsLambda = new NodejsFunction(this, 'ListSessionsFunction', {
      functionName: `${config.CDK_APP_NAME}-list-sessions-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/session/list-sessions-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'ListSessionsFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-list-sessions-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to ListSessionsLambda
    table.grantReadData(listSessionsLambda);

    // Get Session Lambda Function
    const getSessionLambda = new NodejsFunction(this, 'GetSessionFunction', {
      functionName: `${config.CDK_APP_NAME}-get-session-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/session/get-session-handler.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'GetSessionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-get-session-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to GetSessionLambda
    table.grantReadData(getSessionLambda);

    // Read JD Action Lambda Function (Bedrock Agent action group handler)
    this.readJdActionLambda = new NodejsFunction(this, 'ReadJdActionFunction', {
      functionName: `${config.CDK_APP_NAME}-read-jd-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/read-jd-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'ReadJdActionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-read-jd-action-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to ReadJdActionLambda
    table.grantReadData(this.readJdActionLambda);

    // Write Plan Action Lambda Function (Bedrock Agent action group handler)
    this.writePlanActionLambda = new NodejsFunction(this, 'WritePlanActionFunction', {
      functionName: `${config.CDK_APP_NAME}-write-plan-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/session/write-plan-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'WritePlanActionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-write-plan-action-${config.CDK_ENV_NAME}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant permissions to WritePlanActionLambda
    table.grantReadWriteData(this.writePlanActionLambda);

    // Wire API Gateway routes
    // GET /health
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthLambda));

    // POST /jds
    const jdsResource = this.api.root.addResource('jds');
    jdsResource.addMethod('POST', new apigateway.LambdaIntegration(createJdLambda));

    // GET /jds
    jdsResource.addMethod('GET', new apigateway.LambdaIntegration(listJdLambda));

    // POST /jds/upload-url
    const uploadUrlResource = jdsResource.addResource('upload-url');
    uploadUrlResource.addMethod('POST', new apigateway.LambdaIntegration(createJdUrlLambda));

    // GET /jds/{jdId}
    const jdIdResource = jdsResource.addResource('{jdId}');
    jdIdResource.addMethod('GET', new apigateway.LambdaIntegration(getJdLambda));
    // POST /jds/{jdId}/sessions
    const sessionsResource = jdIdResource.addResource('sessions');
    sessionsResource.addMethod('POST', new apigateway.LambdaIntegration(createSessionLambda));

    // GET /jds/{jdId}/sessions
    sessionsResource.addMethod('GET', new apigateway.LambdaIntegration(listSessionsLambda));

    // GET /jds/{jdId}/sessions/{sessionId}
    const sessionIdResource = sessionsResource.addResource('{sessionId}');
    sessionIdResource.addMethod('GET', new apigateway.LambdaIntegration(getSessionLambda));

    // Export the API Gateway URL as a stack output
    new cdk.CfnOutput(this, 'APIGatewayUrl', {
      value: this.api.url || '',
      description: 'HTTP API Gateway endpoint URL',
      exportName: `${config.CDK_APP_NAME}-APIGatewayUrl-${config.CDK_ENV_NAME}`,
    });
  }
}

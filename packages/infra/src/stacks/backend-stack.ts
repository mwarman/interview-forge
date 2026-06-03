import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

import type { Config } from '../utils/config.js';

/**
 * Props for the BackendStack
 */
interface BackendStackProps extends cdk.StackProps {
  config: Config;
}

/**
 * BackendStack: API and compute resources
 * This stack contains all API Gateway and Lambda resources.
 */
export class BackendStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { config } = props;

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
  }
}

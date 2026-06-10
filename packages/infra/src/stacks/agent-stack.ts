import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'path';

import type { Config } from '../utils/config.js';
import { PLAN_GENERATION_SYSTEM_PROMPT } from '../utils/prompts.js';
import { CLAUDE_HAIKU_4_5_MODEL_ID } from '../utils/constants.js';

/**
 * Props for the AgentStack
 */
interface AgentStackProps extends cdk.StackProps {
  config: Config;
  table: dynamodb.Table;
  bucket: s3.Bucket;
}

/**
 * AgentStack: Bedrock Agent resources for interview plan generation
 * This stack contains Bedrock agent action group Lambdas, the plan agent, its action groups, IAM role, and alias.
 */
export class AgentStack extends cdk.Stack {
  public readonly readJdActionLambda: NodejsFunction;
  public readonly writePlanActionLambda: NodejsFunction;
  public readonly planAgent: bedrock.CfnAgent;
  public readonly planAgentAlias: bedrock.CfnAgentAlias;

  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, props);

    const { config, table, bucket } = props;

    // Create shared Lambda environment variables
    const lambdaEnvironment = {
      LOG_LEVEL: config.CDK_LOG_LEVEL,
      LOG_FORMAT: config.CDK_LOG_FORMAT,
      LOG_ENABLED: config.CDK_LOG_ENABLED,
      JD_TABLE_NAME: table.tableName,
      JD_BUCKET_NAME: bucket.bucketName,
      PLAN_AGENT_ID: 'placeholder', // Required for config validation, but not needed in the Action Lambdas
      PLAN_AGENT_ALIAS_ID: 'placeholder', // Required for config validation, but not needed in the Action Lambdas
    };

    // Read JD Action Lambda Function (Bedrock Agent action group handler)
    this.readJdActionLambda = new NodejsFunction(this, 'ReadJdActionFunction', {
      functionName: `${config.CDK_APP_NAME}-read-jd-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/job-description/read-jd-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 512,
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
      memorySize: 512,
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

    // Create the IAM execution role for the Bedrock Agent.
    // AWS requires the role name to start with AmazonBedrockExecutionRoleForAgents_.
    const agentRole = new iam.Role(this, 'PlanAgentRole', {
      roleName: `AmazonBedrockExecutionRoleForAgents_${config.CDK_APP_NAME}-plan-${config.CDK_ENV_NAME}`,
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
        conditions: {
          StringEquals: { 'aws:SourceAccount': this.account },
        },
      }),
    });

    // Grant the agent role permission to invoke the Claude Sonnet 4.6 model.
    // The cross-region inference profile and all regional foundation model ARNs are required.
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:ListInferenceProfiles', 'bedrock:GetInferenceProfile'],
        resources: [
          `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.${CLAUDE_HAIKU_4_5_MODEL_ID}`,
          `arn:aws:bedrock:us-east-1::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
          `arn:aws:bedrock:us-east-2::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
          `arn:aws:bedrock:us-west-2::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
        ],
      }),
    );

    // Define the read-jd action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the read-jd-action Lambda schema ('interview-forge-read-jd').
    const readJdActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-read-jd',
      actionGroupExecutor: {
        lambda: this.readJdActionLambda.functionArn,
      },
      functionSchema: {
        functions: [
          {
            name: 'read-jd-action',
            description:
              'Reads a job description from storage by its unique identifier. Returns the job description title and raw text content.',
            parameters: {
              jdId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the job description to read.',
                required: true,
              },
            },
          },
        ],
      },
    };

    // Define the write-plan action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the write-plan-action Lambda schema ('interview-forge-write-plan').
    const writePlanActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-write-plan',
      actionGroupExecutor: {
        lambda: this.writePlanActionLambda.functionArn,
      },
      functionSchema: {
        functions: [
          {
            name: 'write-plan-action',
            description:
              'Writes a completed interview plan to a session in storage. The plan must include interview rounds with competency areas and structured questions.',
            parameters: {
              sessionId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the session to update with the interview plan.',
                required: true,
              },
              jdId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the parent job description.',
                required: true,
              },
              plan: {
                type: 'string',
                description:
                  'The complete interview plan serialized as a JSON string, conforming to the InterviewPlan schema with an interviewRounds array.',
                required: true,
              },
            },
          },
        ],
      },
    };

    // Create the Bedrock Plan Agent
    this.planAgent = new bedrock.CfnAgent(this, 'PlanAgent', {
      agentName: `${config.CDK_APP_NAME}-plan-agent`,
      foundationModel: `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.${CLAUDE_HAIKU_4_5_MODEL_ID}`,
      agentResourceRoleArn: agentRole.roleArn,
      instruction: PLAN_GENERATION_SYSTEM_PROMPT,
      actionGroups: [readJdActionGroup, writePlanActionGroup],
      // Allow the CDK to skip the in-use check on delete for dev/qa environments
      skipResourceInUseCheckOnDelete: true,
    });

    // Create the DRAFT alias for development.
    // Omitting routingConfiguration defaults to the DRAFT version.
    this.planAgentAlias = new bedrock.CfnAgentAlias(this, 'PlanAgentAlias', {
      agentId: this.planAgent.attrAgentId,
      agentAliasName: 'dev',
    });

    // Grant the Bedrock service principal permission to invoke the read-jd-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeReadJdAction', {
      functionName: this.readJdActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.planAgent.attrAgentArn,
    });

    // Grant the Bedrock service principal permission to invoke the write-plan-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeWritePlanAction', {
      functionName: this.writePlanActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.planAgent.attrAgentArn,
    });

    // Export the plan agent ID and alias ID as stack outputs
    new cdk.CfnOutput(this, 'PlanAgentId', {
      value: this.planAgent.attrAgentId,
      description: 'Bedrock Plan Agent ID',
      exportName: `${config.CDK_APP_NAME}-PlanAgentId-${config.CDK_ENV_NAME}`,
    });

    new cdk.CfnOutput(this, 'PlanAgentAliasId', {
      value: this.planAgentAlias.attrAgentAliasId,
      description: 'Bedrock Plan Agent Alias ID (dev)',
      exportName: `${config.CDK_APP_NAME}-PlanAgentAliasId-${config.CDK_ENV_NAME}`,
    });
  }
}

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
import { PLAN_GENERATION_SYSTEM_PROMPT, RECONCILIATION_SYSTEM_PROMPT } from '../utils/prompts.js';
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
 * AgentStack: Bedrock Agent resources for interview plan generation and assessment reconciliation
 * This stack contains Bedrock agent action group Lambdas, the plan agent, the assessment agent, their action groups, IAM roles, and aliases.
 */
export class AgentStack extends cdk.Stack {
  public readonly readJdActionLambda: NodejsFunction;
  public readonly writePlanActionLambda: NodejsFunction;
  public readonly readPlanActionLambda: NodejsFunction;
  public readonly readScorecardActionLambda: NodejsFunction;
  public readonly writeAssessmentActionLambda: NodejsFunction;
  public readonly planAgent: bedrock.CfnAgent;
  public readonly planAgentAlias: bedrock.CfnAgentAlias;
  public readonly assessAgent: bedrock.CfnAgent;
  public readonly assessAgentAlias: bedrock.CfnAgentAlias;

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
      PLAN_WORKER_FUNCTION_NAME: 'placeholder', // Not used in the Action Lambdas, but included for validation
      ASSESS_AGENT_ID: 'placeholder', // Required for config validation, but not needed in the Action Lambdas
      ASSESS_AGENT_ALIAS_ID: 'placeholder', // Required for config validation, but not needed in the Action Lambdas
      ASSESS_WORKER_FUNCTION_NAME: 'placeholder', // Not used in the Action Lambdas, but included for validation
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
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/plan/write-plan-action.ts'),
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

    // Read Plan Action Lambda Function (Bedrock Agent action group handler)
    this.readPlanActionLambda = new NodejsFunction(this, 'ReadPlanActionFunction', {
      functionName: `${config.CDK_APP_NAME}-read-plan-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/plan/read-plan-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'ReadPlanActionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-read-plan-action-${config.CDK_ENV_NAME}`,
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

    // Grant permissions to ReadPlanActionLambda
    table.grantReadData(this.readPlanActionLambda);

    // Read Scorecard Action Lambda Function (Bedrock Agent action group handler)
    this.readScorecardActionLambda = new NodejsFunction(this, 'ReadScorecardActionFunction', {
      functionName: `${config.CDK_APP_NAME}-read-scorecard-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/scorecard/read-scorecard-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'ReadScorecardActionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-read-scorecard-action-${config.CDK_ENV_NAME}`,
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

    // Grant permissions to ReadScorecardActionLambda
    table.grantReadData(this.readScorecardActionLambda);

    // Write Assessment Action Lambda Function (Bedrock Agent action group handler)
    this.writeAssessmentActionLambda = new NodejsFunction(this, 'WriteAssessmentActionFunction', {
      functionName: `${config.CDK_APP_NAME}-write-assessment-action-${config.CDK_ENV_NAME}`,
      entry: path.join(import.meta.dirname, '../../../api/src/handlers/assessment/write-assessment-action.ts'),
      handler: 'handle',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: new logs.LogGroup(this, 'WriteAssessmentActionFunctionLogGroup', {
        logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-write-assessment-action-${config.CDK_ENV_NAME}`,
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

    // Grant permissions to WriteAssessmentActionLambda
    table.grantReadWriteData(this.writeAssessmentActionLambda);

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

    // Create the IAM execution role for the Bedrock Assessment Agent.
    // AWS requires the role name to start with AmazonBedrockExecutionRoleForAgents_.
    const assessAgentRole = new iam.Role(this, 'AssessAgentRole', {
      roleName: `AmazonBedrockExecutionRoleForAgents_${config.CDK_APP_NAME}-assess-${config.CDK_ENV_NAME}`,
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
        conditions: {
          StringEquals: { 'aws:SourceAccount': this.account },
        },
      }),
    });

    // Grant the assessment agent role permission to invoke the Claude Haiku 4.5 model.
    // The cross-region inference profile and all regional foundation model ARNs are required.
    assessAgentRole.addToPolicy(
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

    // Define the read-plan action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the read-plan-action Lambda schema ('interview-forge-read-plan').
    const readPlanActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-read-plan',
      actionGroupExecutor: {
        lambda: this.readPlanActionLambda.functionArn,
      },
      functionSchema: {
        functions: [
          {
            name: 'read-plan-action',
            description:
              'Reads the approved interview plan from storage by session ID. Returns the full InterviewPlan with competencies and questions.',
            parameters: {
              jdId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the parent job description.',
                required: true,
              },
              sessionId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the session to retrieve the plan from.',
                required: true,
              },
            },
          },
        ],
      },
    };

    // Define the read-scorecard action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the read-scorecard-action Lambda schema ('interview-forge-read-scorecard').
    const readScorecardActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-read-scorecard',
      actionGroupExecutor: {
        lambda: this.readScorecardActionLambda.functionArn,
      },
      functionSchema: {
        functions: [
          {
            name: 'read-scorecard-action',
            description:
              'Reads the submitted interview scorecard from storage by session ID. Returns the scorecard with Likert ratings and free-text notes per competency.',
            parameters: {
              jdId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the parent job description.',
                required: true,
              },
              sessionId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the session to retrieve the scorecard from.',
                required: true,
              },
            },
          },
        ],
      },
    };

    // Define the write-assessment action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the write-assessment-action Lambda schema ('interview-forge-write-assessment').
    const writeAssessmentActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-write-assessment',
      actionGroupExecutor: {
        lambda: this.writeAssessmentActionLambda.functionArn,
      },
      functionSchema: {
        functions: [
          {
            name: 'write-assessment-action',
            description:
              'Writes a completed candidate assessment to a session in storage. The assessment must include recommendation, confidence, reasoning, and per-competency assessments with conflicts identified.',
            parameters: {
              sessionId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the session to update with the assessment.',
                required: true,
              },
              jdId: {
                type: 'string',
                description: 'The unique identifier (UUID) of the parent job description.',
                required: true,
              },
              assessment: {
                type: 'string',
                description:
                  'The complete assessment serialized as a JSON string, conforming to the Assessment schema with recommendation, confidence, reasoning, and competencyAssessments array.',
                required: true,
              },
            },
          },
        ],
      },
    };

    // Create the Bedrock Assessment Agent
    this.assessAgent = new bedrock.CfnAgent(this, 'AssessAgent', {
      agentName: `${config.CDK_APP_NAME}-assess-agent`,
      foundationModel: `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.${CLAUDE_HAIKU_4_5_MODEL_ID}`,
      agentResourceRoleArn: assessAgentRole.roleArn,
      instruction: RECONCILIATION_SYSTEM_PROMPT,
      actionGroups: [readPlanActionGroup, readScorecardActionGroup, writeAssessmentActionGroup],
      // Allow the CDK to skip the in-use check on delete for dev/qa environments
      skipResourceInUseCheckOnDelete: true,
    });

    // Create the DRAFT alias for development.
    // Omitting routingConfiguration defaults to the DRAFT version.
    this.assessAgentAlias = new bedrock.CfnAgentAlias(this, 'AssessAgentAlias', {
      agentId: this.assessAgent.attrAgentId,
      agentAliasName: 'dev',
    });

    // Grant the Bedrock service principal permission to invoke the read-plan-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeReadPlanAction', {
      functionName: this.readPlanActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.assessAgent.attrAgentArn,
    });

    // Grant the Bedrock service principal permission to invoke the read-scorecard-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeReadScorecardAction', {
      functionName: this.readScorecardActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.assessAgent.attrAgentArn,
    });

    // Grant the Bedrock service principal permission to invoke the write-assessment-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeWriteAssessmentAction', {
      functionName: this.writeAssessmentActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.assessAgent.attrAgentArn,
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

    // Export the assessment agent ID and alias ID as stack outputs
    new cdk.CfnOutput(this, 'AssessAgentId', {
      value: this.assessAgent.attrAgentId,
      description: 'Bedrock Assessment Agent ID',
      exportName: `${config.CDK_APP_NAME}-AssessAgentId-${config.CDK_ENV_NAME}`,
    });

    new cdk.CfnOutput(this, 'AssessAgentAliasId', {
      value: this.assessAgentAlias.attrAgentAliasId,
      description: 'Bedrock Assessment Agent Alias ID (dev)',
      exportName: `${config.CDK_APP_NAME}-AssessAgentAliasId-${config.CDK_ENV_NAME}`,
    });
  }
}

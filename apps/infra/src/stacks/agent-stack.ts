import * as cdk from 'aws-cdk-lib';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
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
 * A string input property of an AgentCore gateway tool
 */
interface ToolProperty {
  description: string;
}

/**
 * Definition of an AgentCore gateway tool backed by a Lambda function.
 * The tool name doubles as the gateway target name.
 */
interface ToolDefinition {
  name: string;
  description: string;
  properties: Record<string, ToolProperty>;
}

/**
 * Inputs for a single AgentCore agent (gateway, tool targets and harness)
 */
interface AgentDefinition {
  key: 'plan' | 'assess';
  systemPrompt: string;
  tools: Array<{ lambda: NodejsFunction; definition: ToolDefinition }>;
}

const JD_ID_PROPERTY: ToolProperty = { description: 'The unique identifier (UUID) of the parent job description.' };

/**
 * Maximum duration of one harness invocation. Kept below the 300 s worker Lambda timeout so the
 * harness fails first and the worker can record the error.
 */
const HARNESS_TIMEOUT_SECONDS = 240;
const HARNESS_MAX_ITERATIONS = 10;
const HARNESS_MAX_TOKENS = 8192;

/**
 * AgentStack: AgentCore resources for interview plan generation and assessment reconciliation
 * This stack contains the gateway tool Lambdas, one AgentCore gateway (with a Lambda target per tool)
 * and one AgentCore harness per agent (plan, assessment), plus their IAM roles.
 */
export class AgentStack extends cdk.Stack {
  public readonly readJdActionLambda: NodejsFunction;
  public readonly writePlanActionLambda: NodejsFunction;
  public readonly readPlanActionLambda: NodejsFunction;
  public readonly readScorecardActionLambda: NodejsFunction;
  public readonly writeAssessmentActionLambda: NodejsFunction;
  public readonly planHarness: bedrockagentcore.CfnHarness;
  public readonly assessHarness: bedrockagentcore.CfnHarness;

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
      PLAN_HARNESS_ARN: 'placeholder', // Required for config validation, but not needed in the tool Lambdas
      PLAN_WORKER_FUNCTION_NAME: 'placeholder', // Not used in the tool Lambdas, but included for validation
      ASSESS_HARNESS_ARN: 'placeholder', // Required for config validation, but not needed in the tool Lambdas
      ASSESS_WORKER_FUNCTION_NAME: 'placeholder', // Not used in the tool Lambdas, but included for validation
    };

    const createToolLambda = (constructId: string, name: string, entry: string): NodejsFunction =>
      new NodejsFunction(this, `${constructId}Function`, {
        functionName: `${config.CDK_APP_NAME}-${name}-${config.CDK_ENV_NAME}`,
        description: `AgentCore gateway tool: ${name}`,
        entry: path.join(import.meta.dirname, `../../../api/src/handlers/${entry}.ts`),
        handler: 'handle',
        runtime: lambda.Runtime.NODEJS_24_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(15),
        loggingFormat: lambda.LoggingFormat.JSON,
        applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
        systemLogLevelV2: lambda.SystemLogLevel.INFO,
        logGroup: new logs.LogGroup(this, `${constructId}FunctionLogGroup`, {
          logGroupName: `/aws/lambda/${config.CDK_APP_NAME}-${name}-${config.CDK_ENV_NAME}`,
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

    // Tool Lambdas (AgentCore gateway Lambda targets)
    this.readJdActionLambda = createToolLambda('ReadJdAction', 'read-jd-action', 'job-description/read-jd-action');
    table.grantReadData(this.readJdActionLambda);

    this.writePlanActionLambda = createToolLambda('WritePlanAction', 'write-plan-action', 'plan/write-plan-action');
    table.grantReadWriteData(this.writePlanActionLambda);

    this.readPlanActionLambda = createToolLambda('ReadPlanAction', 'read-plan-action', 'plan/read-plan-action');
    table.grantReadData(this.readPlanActionLambda);

    this.readScorecardActionLambda = createToolLambda(
      'ReadScorecardAction',
      'read-scorecard-action',
      'scorecard/read-scorecard-action',
    );
    table.grantReadData(this.readScorecardActionLambda);

    this.writeAssessmentActionLambda = createToolLambda(
      'WriteAssessmentAction',
      'write-assessment-action',
      'assessment/write-assessment-action',
    );
    table.grantReadWriteData(this.writeAssessmentActionLambda);

    // Creates an IAM role that the AgentCore service assumes (gateway service role / harness execution role)
    const createAgentCoreRole = (constructId: string): iam.Role =>
      new iam.Role(this, constructId, {
        assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com', {
          conditions: {
            StringEquals: { 'aws:SourceAccount': this.account },
          },
        }),
      });

    // Creates the gateway, tool targets, roles and harness for one agent
    const createAgent = ({ key, systemPrompt, tools }: AgentDefinition): bedrockagentcore.CfnHarness => {
      const label = key === 'plan' ? 'Plan' : 'Assess';

      // Gateway service role: invokes the agent's tool Lambdas
      const gatewayRole = createAgentCoreRole(`${label}GatewayRole`);
      gatewayRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['lambda:InvokeFunction'],
          resources: tools.map(({ lambda: toolLambda }) => toolLambda.functionArn),
        }),
      );

      // One gateway per agent keeps each agent's tool access isolated
      const gateway = new bedrockagentcore.CfnGateway(this, `${label}Gateway`, {
        name: `${config.CDK_APP_NAME}-${key}-gateway-${config.CDK_ENV_NAME}`,
        description: `Tools for the ${config.CDK_APP_NAME} ${key} agent`,
        protocolType: 'MCP',
        authorizerType: 'AWS_IAM',
        roleArn: gatewayRole.roleArn,
      });
      gateway.node.addDependency(gatewayRole);

      // One Lambda target per tool; the tool schema mirrors the arguments validated by the Lambda handler
      const targets = tools.map(({ lambda: toolLambda, definition }) => {
        const target = new bedrockagentcore.CfnGatewayTarget(
          this,
          `${label}${definition.name
            .split('-')
            .map((part) => part[0].toUpperCase() + part.slice(1))
            .join('')}Target`,
          {
            name: definition.name,
            gatewayIdentifier: gateway.attrGatewayIdentifier,
            credentialProviderConfigurations: [{ credentialProviderType: 'GATEWAY_IAM_ROLE' }],
            targetConfiguration: {
              mcp: {
                lambda: {
                  lambdaArn: toolLambda.functionArn,
                  toolSchema: {
                    inlinePayload: [
                      {
                        name: definition.name,
                        description: definition.description,
                        inputSchema: {
                          type: 'object',
                          properties: Object.fromEntries(
                            Object.entries(definition.properties).map(([propertyName, property]) => [
                              propertyName,
                              { type: 'string', description: property.description },
                            ]),
                          ),
                          required: Object.keys(definition.properties),
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        );
        target.node.addDependency(gatewayRole);
        return target;
      });

      // Harness execution role: invokes the model and the agent's gateway
      const harnessRole = createAgentCoreRole(`${label}HarnessRole`);
      harnessRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'bedrock:InvokeModel',
            'bedrock:InvokeModelWithResponseStream',
            'bedrock:ListInferenceProfiles',
            'bedrock:GetInferenceProfile',
          ],
          resources: [
            `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.${CLAUDE_HAIKU_4_5_MODEL_ID}`,
            `arn:aws:bedrock:us-east-1::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
            `arn:aws:bedrock:us-east-2::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
            `arn:aws:bedrock:us-west-2::foundation-model/${CLAUDE_HAIKU_4_5_MODEL_ID}`,
          ],
        }),
      );
      harnessRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['bedrock-agentcore:InvokeGateway'],
          resources: [gateway.attrGatewayArn],
        }),
      );
      harnessRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/*`],
        }),
      );

      // Harness names allow only letters, digits and underscores (max 40 characters)
      const harness = new bedrockagentcore.CfnHarness(this, `${label}Harness`, {
        harnessName: `${config.CDK_APP_NAME}_${key}_${config.CDK_ENV_NAME}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        executionRoleArn: harnessRole.roleArn,
        model: {
          bedrockModelConfig: {
            modelId: `us.${CLAUDE_HAIKU_4_5_MODEL_ID}`,
            maxTokens: HARNESS_MAX_TOKENS,
          },
        },
        systemPrompt: [{ text: systemPrompt }],
        tools: [
          {
            type: 'agentcore_gateway',
            name: `${key}_gateway`,
            config: {
              agentCoreGateway: {
                gatewayArn: gateway.attrGatewayArn,
                outboundAuth: { awsIam: {} },
              },
            },
          },
        ],
        maxIterations: HARNESS_MAX_ITERATIONS,
        timeoutSeconds: HARNESS_TIMEOUT_SECONDS,
        // The agents are stateless: results are persisted by the write tool, not by harness memory
        memory: { disabled: {} },
      });
      harness.node.addDependency(harnessRole);
      targets.forEach((target) => harness.node.addDependency(target));

      return harness;
    };

    this.planHarness = createAgent({
      key: 'plan',
      systemPrompt: PLAN_GENERATION_SYSTEM_PROMPT,
      tools: [
        {
          lambda: this.readJdActionLambda,
          definition: {
            name: 'read-jd',
            description:
              'Reads a job description from storage by its unique identifier. Returns the job description title and raw text content.',
            properties: {
              jdId: { description: 'The unique identifier (UUID) of the job description to read.' },
            },
          },
        },
        {
          lambda: this.writePlanActionLambda,
          definition: {
            name: 'write-plan',
            description:
              'Writes a completed interview plan to a session in storage. The plan must include competency areas with structured questions.',
            properties: {
              sessionId: {
                description: 'The unique identifier (UUID) of the session to update with the interview plan.',
              },
              jdId: JD_ID_PROPERTY,
              plan: {
                description:
                  'The complete interview plan serialized as a JSON string, conforming to the InterviewPlan schema with a competencies array.',
              },
            },
          },
        },
      ],
    });

    this.assessHarness = createAgent({
      key: 'assess',
      systemPrompt: RECONCILIATION_SYSTEM_PROMPT,
      tools: [
        {
          lambda: this.readPlanActionLambda,
          definition: {
            name: 'read-plan',
            description:
              'Reads the approved interview plan from storage by session ID. Returns the full InterviewPlan with competencies and questions.',
            properties: {
              jdId: JD_ID_PROPERTY,
              sessionId: { description: 'The unique identifier (UUID) of the session to retrieve the plan from.' },
            },
          },
        },
        {
          lambda: this.readScorecardActionLambda,
          definition: {
            name: 'read-scorecard',
            description:
              'Reads the submitted interview scorecard from storage by session ID. Returns the scorecard with Likert ratings and free-text notes per competency.',
            properties: {
              jdId: JD_ID_PROPERTY,
              sessionId: {
                description: 'The unique identifier (UUID) of the session to retrieve the scorecard from.',
              },
            },
          },
        },
        {
          lambda: this.writeAssessmentActionLambda,
          definition: {
            name: 'write-assessment',
            description:
              'Writes a completed candidate assessment to a session in storage. The assessment must include recommendation, confidence, reasoning, and per-competency assessments with conflicts identified.',
            properties: {
              sessionId: {
                description: 'The unique identifier (UUID) of the session to update with the assessment.',
              },
              jdId: JD_ID_PROPERTY,
              assessment: {
                description:
                  'The complete assessment serialized as a JSON string, conforming to the Assessment schema with recommendation, confidence, reasoning, and competencyAssessments array.',
              },
            },
          },
        },
      ],
    });

    // Export the harness ARNs as stack outputs
    new cdk.CfnOutput(this, 'PlanHarnessArn', {
      value: this.planHarness.attrArn,
      description: 'AgentCore Plan Harness ARN',
      exportName: `${config.CDK_APP_NAME}-PlanHarnessArn-${config.CDK_ENV_NAME}`,
    });

    new cdk.CfnOutput(this, 'AssessHarnessArn', {
      value: this.assessHarness.attrArn,
      description: 'AgentCore Assessment Harness ARN',
      exportName: `${config.CDK_APP_NAME}-AssessHarnessArn-${config.CDK_ENV_NAME}`,
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

import type { Config } from '../utils/config.js';
import { PLAN_GENERATION_SYSTEM_PROMPT } from '../utils/prompts.js';

/**
 * Claude Sonnet 4.6 model identifier used by Bedrock Agents
 */
const CLAUDE_SONNET_4_6_MODEL_ID = 'anthropic.claude-sonnet-4-6';

/**
 * Props for the AgentStack
 */
interface AgentStackProps extends cdk.StackProps {
  config: Config;
  readJdActionLambda: lambda.IFunction;
  writePlanActionLambda: lambda.IFunction;
}

/**
 * AgentStack: Bedrock Agent resources for interview plan generation
 * This stack contains the Bedrock plan agent, its action groups, IAM role, and alias.
 */
export class AgentStack extends cdk.Stack {
  public readonly planAgent: bedrock.CfnAgent;
  public readonly planAgentAlias: bedrock.CfnAgentAlias;

  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, props);

    const { config, readJdActionLambda, writePlanActionLambda } = props;

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
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.${CLAUDE_SONNET_4_6_MODEL_ID}`,
          `arn:aws:bedrock:us-east-1::foundation-model/${CLAUDE_SONNET_4_6_MODEL_ID}`,
          `arn:aws:bedrock:us-east-2::foundation-model/${CLAUDE_SONNET_4_6_MODEL_ID}`,
          `arn:aws:bedrock:us-west-2::foundation-model/${CLAUDE_SONNET_4_6_MODEL_ID}`,
        ],
      }),
    );

    // Define the read-jd action group.
    // actionGroupName uses the app name prefix for uniqueness and clarity.
    // Must match the actionGroup literal in the read-jd-action Lambda schema ('interview-forge-read-jd').
    const readJdActionGroup: bedrock.CfnAgent.AgentActionGroupProperty = {
      actionGroupName: 'interview-forge-read-jd',
      actionGroupExecutor: {
        lambda: readJdActionLambda.functionArn,
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
        lambda: writePlanActionLambda.functionArn,
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
      foundationModel: CLAUDE_SONNET_4_6_MODEL_ID,
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
    // CfnPermission is created directly in the AgentStack (not via addPermission) to avoid a
    // cross-stack cyclic dependency: addPermission would place the resource in BackendStack and
    // reference this stack's agent ARN, creating a BackendStack → AgentStack dependency that
    // conflicts with the existing AgentStack → BackendStack dependency.
    new lambda.CfnPermission(this, 'BedrockInvokeReadJdAction', {
      functionName: readJdActionLambda.functionArn,
      principal: 'bedrock.amazonaws.com',
      action: 'lambda:InvokeFunction',
      sourceArn: this.planAgent.attrAgentArn,
    });

    // Grant the Bedrock service principal permission to invoke the write-plan-action Lambda.
    new lambda.CfnPermission(this, 'BedrockInvokeWritePlanAction', {
      functionName: writePlanActionLambda.functionArn,
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

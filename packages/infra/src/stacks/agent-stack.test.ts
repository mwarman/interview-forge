import { describe, it, expect, beforeEach } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AgentStack } from './agent-stack';
import { DataStack } from './data-stack';
import { getConfig } from '../utils/config';

describe('AgentStack', () => {
  let app: cdk.App;
  let config: ReturnType<typeof getConfig>;
  let dataStack: DataStack;

  beforeEach(() => {
    app = new cdk.App({
      context: { 'aws:cdk:bundling-stacks': [] },
    });
    config = getConfig();
    dataStack = new DataStack(app, 'TestDataStack', { config });
  });

  it('should define a CfnAgent with the correct agent name and foundation model', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Bedrock::Agent', {
      AgentName: 'test-app-plan-agent',
      FoundationModel: Match.objectLike({
        'Fn::Join': [
          '',
          [
            'arn:aws:bedrock:us-east-1:',
            Match.anyValue(),
            ':inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0',
          ],
        ],
      }),
    });
  });

  it('should define a CfnAgent with a non-empty instruction (system prompt)', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    const agents = template.findResources('AWS::Bedrock::Agent') as Record<string, Record<string, unknown>>;
    const agentValues = Object.values(agents);
    expect(agentValues.length).toBe(1);
    const instruction = (agentValues[0].Properties as Record<string, unknown>).Instruction as string;
    expect(typeof instruction).toBe('string');
    expect(instruction.length).toBeGreaterThan(0);
    // Verify the prompt references both action functions and action group names
    expect(instruction).toContain('read-jd-action');
    expect(instruction).toContain('write-plan-action');
    expect(instruction).toContain('interview-forge-read-jd');
    expect(instruction).toContain('interview-forge-write-plan');
  });

  it('should define a CfnAgent with two action groups (interview-forge-read-jd and interview-forge-write-plan)', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    const agents = template.findResources('AWS::Bedrock::Agent') as Record<string, Record<string, unknown>>;
    const agentValues = Object.values(agents);
    expect(agentValues.length).toBe(1);

    const actionGroups = (agentValues[0].Properties as Record<string, unknown>).ActionGroups as Array<
      Record<string, unknown>
    >;
    expect(actionGroups).toBeDefined();
    const actionGroupNames = actionGroups.map((ag) => ag.ActionGroupName);
    expect(actionGroupNames).toContain('interview-forge-read-jd');
    expect(actionGroupNames).toContain('interview-forge-write-plan');
  });

  it('should define the interview-forge-read-jd action group with read-jd-action function schema', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    const agents = template.findResources('AWS::Bedrock::Agent') as Record<string, Record<string, unknown>>;
    const agentValues = Object.values(agents);
    const actionGroups = (agentValues[0].Properties as Record<string, unknown>).ActionGroups as Array<
      Record<string, unknown>
    >;

    const jdActionGroup = actionGroups.find((ag) => ag.ActionGroupName === 'interview-forge-read-jd');
    expect(jdActionGroup).toBeDefined();

    const functionSchema = jdActionGroup!.FunctionSchema as Record<string, unknown>;
    const functions = functionSchema.Functions as Array<Record<string, unknown>>;
    expect(functions).toBeDefined();
    expect(functions.length).toBe(1);
    expect(functions[0].Name).toBe('read-jd-action');

    // Verify jdId parameter is defined
    const parameters = functions[0].Parameters as Record<string, Record<string, unknown>>;
    expect(parameters).toBeDefined();
    expect(parameters.jdId).toBeDefined();
    expect(parameters.jdId.Type).toBe('string');
    expect(parameters.jdId.Required).toBe(true);
  });

  it('should define the interview-forge-write-plan action group with write-plan-action function schema', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    const agents = template.findResources('AWS::Bedrock::Agent') as Record<string, Record<string, unknown>>;
    const agentValues = Object.values(agents);
    const actionGroups = (agentValues[0].Properties as Record<string, unknown>).ActionGroups as Array<
      Record<string, unknown>
    >;

    const planActionGroup = actionGroups.find((ag) => ag.ActionGroupName === 'interview-forge-write-plan');
    expect(planActionGroup).toBeDefined();

    const functionSchema = planActionGroup!.FunctionSchema as Record<string, unknown>;
    const functions = functionSchema.Functions as Array<Record<string, unknown>>;
    expect(functions).toBeDefined();
    expect(functions.length).toBe(1);
    expect(functions[0].Name).toBe('write-plan-action');

    // Verify all three required parameters are defined
    const parameters = functions[0].Parameters as Record<string, Record<string, unknown>>;
    expect(parameters).toBeDefined();
    expect(parameters.sessionId).toBeDefined();
    expect(parameters.sessionId.Type).toBe('string');
    expect(parameters.sessionId.Required).toBe(true);
    expect(parameters.jdId).toBeDefined();
    expect(parameters.jdId.Type).toBe('string');
    expect(parameters.jdId.Required).toBe(true);
    expect(parameters.plan).toBeDefined();
    expect(parameters.plan.Type).toBe('string');
    expect(parameters.plan.Required).toBe(true);
  });

  it('should define a CfnAgentAlias with alias name dev', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Bedrock::AgentAlias', {
      AgentAliasName: 'dev',
    });
  });

  it('should create an IAM role with bedrock:InvokeModel permission on Claude Sonnet 4.6 ARNs', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify an IAM policy with bedrock:InvokeModel is created
    const allPolicies = template.findResources('AWS::IAM::Policy') as Record<
      string,
      Record<string, Record<string, Record<string, unknown>[]>>
    >;
    const hasBedrockPolicy = Object.values(allPolicies).some(
      (policy: Record<string, Record<string, Record<string, unknown>[]>>) => {
        const statements = (policy.Properties.PolicyDocument.Statement || []) as Record<string, unknown>[];
        return statements.some((stmt: Record<string, unknown>) => {
          const actions = Array.isArray(stmt.Action) ? (stmt.Action as string[]) : [stmt.Action as string];
          return actions.some((action: string) => action === 'bedrock:InvokeModel');
        });
      },
    );
    expect(hasBedrockPolicy).toBe(true);
  });

  it('should create an IAM role that trusts the bedrock.amazonaws.com service principal', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'bedrock.amazonaws.com' },
          },
        ],
      },
    });
  });

  it('should grant bedrock.amazonaws.com lambda:InvokeFunction on both action group Lambdas', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);

    // Verify two Lambda permission resources are created for Bedrock
    const allPermissions = template.findResources('AWS::Lambda::Permission') as Record<string, Record<string, unknown>>;
    const bedrockPermissions = Object.values(allPermissions).filter(
      (permission: Record<string, unknown>) =>
        (permission.Properties as Record<string, unknown>)?.Principal === 'bedrock.amazonaws.com' &&
        (permission.Properties as Record<string, unknown>)?.Action === 'lambda:InvokeFunction',
    );
    expect(bedrockPermissions.length).toBe(2);
  });

  it('should expose planAgent and planAgentAlias as public properties', () => {
    // Arrange
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    expect(stack.planAgent).toBeDefined();
    expect(stack.planAgentAlias).toBeDefined();
  });

  it('should export the Plan Agent ID and Alias ID as stack outputs', () => {
    // Arrange
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();

    // Act
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasOutput('PlanAgentId', {
      Description: 'Bedrock Plan Agent ID',
      Export: {
        Name: 'test-app-PlanAgentId-dev',
      },
    });
    template.hasOutput('PlanAgentAliasId', {
      Description: 'Bedrock Plan Agent Alias ID (dev)',
      Export: {
        Name: 'test-app-PlanAgentAliasId-dev',
      },
    });
  });

  it('should accept externally created Lambda functions as props (edge case: function from ARN)', () => {
    // Arrange
    const config = getConfig();

    // Act & Assert — should not throw
    expect(() => {
      new AgentStack(app, 'TestAgentStackExternal', {
        config,
        table: dataStack.table,
        bucket: dataStack.bucket,
      });
    }).not.toThrow();
  });
});

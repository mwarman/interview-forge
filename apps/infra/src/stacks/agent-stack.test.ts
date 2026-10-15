import { describe, it, expect, beforeEach } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AgentStack } from './agent-stack';
import { DataStack } from './data-stack';
import { getConfig, getTags } from '../utils/config';

interface PolicyStatement {
  Action: string | string[];
  Resource: string | string[];
}

type Resources = Record<string, { Properties: Record<string, any> }>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('AgentStack', () => {
  let app: cdk.App;
  let dataStack: DataStack;

  const createStack = (): { stack: AgentStack; template: Template } => {
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    const config = getConfig();
    const stack = new AgentStack(app, 'TestAgentStack', {
      config,
      table: dataStack.table,
      bucket: dataStack.bucket,
      tags: getTags(config),
    });
    return { stack, template: Template.fromStack(stack) };
  };

  const findHarness = (template: Template, name: string) =>
    Object.values(template.findResources('AWS::BedrockAgentCore::Harness') as Resources).find(
      (harness) => harness.Properties.HarnessName === name,
    )!.Properties;

  const toolNamesOf = (template: Template, gatewayLogicalIdPrefix: string): string[] =>
    Object.entries(template.findResources('AWS::BedrockAgentCore::GatewayTarget') as Resources)
      .filter(([logicalId]) => logicalId.startsWith(gatewayLogicalIdPrefix))
      .map(([, target]) => target.Properties.Name as string)
      .sort();

  beforeEach(() => {
    app = new cdk.App({
      context: { 'aws:cdk:bundling-stacks': [] },
    });
    process.env.CDK_APP_NAME = 'test-app';
    process.env.CDK_ENV_NAME = 'dev';
    dataStack = new DataStack(app, 'TestDataStack', { config: getConfig() });
  });

  it('should not define any classic Bedrock Agent resources', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.resourceCountIs('AWS::Bedrock::Agent', 0);
    template.resourceCountIs('AWS::Bedrock::AgentAlias', 0);
  });

  it('should define five tool Lambdas with unchanged function names', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.resourceCountIs('AWS::Lambda::Function', 5);
    for (const name of [
      'read-jd-action',
      'write-plan-action',
      'read-plan-action',
      'read-scorecard-action',
      'write-assessment-action',
    ]) {
      template.hasResourceProperties('AWS::Lambda::Function', { FunctionName: `test-app-${name}-dev` });
    }
  });

  it('should define one MCP gateway per agent using IAM authorization', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.resourceCountIs('AWS::BedrockAgentCore::Gateway', 2);
    for (const key of ['plan', 'assess']) {
      template.hasResourceProperties('AWS::BedrockAgentCore::Gateway', {
        Name: `test-app-${key}-gateway-dev`,
        ProtocolType: 'MCP',
        AuthorizerType: 'AWS_IAM',
      });
    }
  });

  it('should define Lambda gateway targets isolated per agent', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.resourceCountIs('AWS::BedrockAgentCore::GatewayTarget', 5);
    expect(toolNamesOf(template, 'Plan')).toEqual(['read-jd', 'write-plan']);
    expect(toolNamesOf(template, 'Assess')).toEqual(['read-plan', 'read-scorecard', 'write-assessment']);
  });

  it('should define tool schemas with required string arguments for every target', () => {
    // Act
    const { template } = createStack();

    // Assert
    const targets = Object.values(template.findResources('AWS::BedrockAgentCore::GatewayTarget') as Resources);
    const requiredByTool = Object.fromEntries(
      targets.map((target) => {
        const tool = target.Properties.TargetConfiguration.Mcp.Lambda.ToolSchema.InlinePayload[0];
        expect(tool.Name).toBe(target.Properties.Name);
        expect(tool.InputSchema.Type).toBe('object');
        expect(Object.values(tool.InputSchema.Properties).every((p: any) => p.Type === 'string')).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(target.Properties.CredentialProviderConfigurations).toEqual([
          { CredentialProviderType: 'GATEWAY_IAM_ROLE' },
        ]);
        return [tool.Name, [...tool.InputSchema.Required].sort()];
      }),
    );
    expect(requiredByTool).toEqual({
      'read-jd': ['jdId'],
      'write-plan': ['jdId', 'plan', 'sessionId'],
      'read-plan': ['jdId', 'sessionId'],
      'read-scorecard': ['jdId', 'sessionId'],
      'write-assessment': ['assessment', 'jdId', 'sessionId'],
    });
  });

  it('should define a plan harness using Claude Haiku 4.5 and the plan system prompt', () => {
    // Act
    const { template } = createStack();

    // Assert
    const harness = findHarness(template, 'test_app_plan_dev');
    expect(harness.Model.BedrockModelConfig.ModelId).toBe('us.anthropic.claude-haiku-4-5-20251001-v1:0');
    expect(harness.SystemPrompt).toHaveLength(1);
    expect(harness.SystemPrompt[0].Text).toContain('**read-jd** tool');
    expect(harness.SystemPrompt[0].Text).toContain('**write-plan** tool');
  });

  it('should define an assess harness using Claude Haiku 4.5 and the reconciliation system prompt', () => {
    // Act
    const { template } = createStack();

    // Assert
    const harness = findHarness(template, 'test_app_assess_dev');
    expect(harness.Model.BedrockModelConfig.ModelId).toBe('us.anthropic.claude-haiku-4-5-20251001-v1:0');
    expect(harness.SystemPrompt[0].Text).toContain('**read-scorecard** tool');
    expect(harness.SystemPrompt[0].Text).toContain('**write-assessment** tool');
  });

  it('should bound harness runtime below the worker Lambda timeout and disable memory', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.resourceCountIs('AWS::BedrockAgentCore::Harness', 2);
    template.allResourcesProperties('AWS::BedrockAgentCore::Harness', {
      TimeoutSeconds: 240,
      MaxIterations: 10,
      Memory: { Disabled: {} },
      Tools: [
        Match.objectLike({
          Type: 'agentcore_gateway',
          Config: { AgentCoreGateway: Match.objectLike({ OutboundAuth: { AwsIam: {} } }) },
        }),
      ],
    });
  });

  it('should trust the AgentCore service in the gateway and harness roles', () => {
    // Act
    const { template } = createStack();

    // Assert
    const roles = Object.values(template.findResources('AWS::IAM::Role') as Resources).filter((role) =>
      JSON.stringify(role.Properties.AssumeRolePolicyDocument).includes('bedrock-agentcore.amazonaws.com'),
    );
    expect(roles).toHaveLength(4); // 2 gateway roles + 2 harness roles
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Principal: { Service: 'bedrock-agentcore.amazonaws.com' },
            Condition: { StringEquals: { 'aws:SourceAccount': Match.anyValue() } },
          }),
        ],
      },
    });
  });

  it('should grant gateway roles lambda:InvokeFunction on their tool Lambdas', () => {
    // Act
    const { template } = createStack();

    // Assert
    const policies = Object.values(template.findResources('AWS::IAM::Policy') as Resources);
    const invokeStatements = policies.flatMap((policy) =>
      (policy.Properties.PolicyDocument.Statement as PolicyStatement[]).filter((statement) =>
        [statement.Action].flat().includes('lambda:InvokeFunction'),
      ),
    );
    expect(invokeStatements.map((s) => [s.Resource].flat().length).sort()).toEqual([2, 3]);
  });

  it('should grant harness roles model invocation and gateway invocation', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream']),
            Resource: Match.arrayWith([
              Match.objectLike({
                'Fn::Join': ['', Match.arrayWith([':inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0'])],
              }),
              'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
              'arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
              'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
            ]),
          }),
          Match.objectLike({
            Action: 'bedrock-agentcore:InvokeGateway',
            Resource: Match.anyValue(),
          }),
        ]),
      },
    });
  });

  it('should expose the tool Lambdas and harnesses as public properties', () => {
    // Act
    const { stack } = createStack();

    // Assert
    expect(stack.readJdActionLambda).toBeDefined();
    expect(stack.writePlanActionLambda).toBeDefined();
    expect(stack.readPlanActionLambda).toBeDefined();
    expect(stack.readScorecardActionLambda).toBeDefined();
    expect(stack.writeAssessmentActionLambda).toBeDefined();
    expect(stack.planHarness).toBeDefined();
    expect(stack.assessHarness).toBeDefined();
  });

  it('should export the harness ARNs as stack outputs', () => {
    // Act
    const { template } = createStack();

    // Assert
    template.hasOutput('PlanHarnessArn', { Export: { Name: 'test-app-PlanHarnessArn-dev' } });
    template.hasOutput('AssessHarnessArn', { Export: { Name: 'test-app-AssessHarnessArn-dev' } });
    expect(Object.keys(template.toJSON().Outputs)).toEqual(['PlanHarnessArn', 'AssessHarnessArn']);
  });

  it('should apply the required organizational tags at the stack level so CloudFormation tags every resource', () => {
    // Act
    const { stack } = createStack();

    // Assert
    expect(Object.keys(stack.tags.tagValues()).sort()).toEqual(['App', 'Env', 'OU', 'Owner']);
  });
});

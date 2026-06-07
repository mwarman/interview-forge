import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('@/services/plan-service', () => ({
  planService: {
    generatePlan: vi.fn(),
  },
}));

import { handle } from './plan-handler';
import { planService } from '@/services/plan-service';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (jdId: string, sessionId: string): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: `/jds/${jdId}/sessions/${sessionId}/plan`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /jds/{jdId}/sessions/{sessionId}/plan',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId}/sessions/${sessionId}/plan`,
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    routeKey: 'POST /jds/{jdId}/sessions/{sessionId}/plan',
    pathParameters: {
      jdId,
      sessionId,
    },
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'plan-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:plan-handler',
    memoryLimitInMB: '128',
    awsRequestId: 'test-req-id-123',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  }) as unknown as Context;

/**
 * Helper to create a mock session with plan
 */
const createMockSessionWithPlan = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'PLAN_APPROVED',
  plan: {
    competencies: [
      {
        name: 'JavaScript Fundamentals',
        level: 'advanced',
        questions: [
          {
            id: 'q1',
            text: 'Explain closures',
            type: 'technical',
          },
        ],
      },
    ],
  },
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

describe('plan-handler', () => {
  const jdId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should return 200 with session and plan on successful generation', async () => {
      // Arrange
      const mockSession = createMockSessionWithPlan(jdId, sessionId);
      vi.mocked(planService.generatePlan).mockResolvedValue(mockSession);

      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      expect(planService.generatePlan).toHaveBeenCalledWith(jdId, sessionId);
      const body = JSON.parse(result.body || '{}');
      expect(body.plan).toBeDefined();
      expect(body.sessionId).toBe(sessionId);
    });
  });

  describe('error path - PlanNotWrittenError', () => {
    it('should return 502 when agent completes without writing plan', async () => {
      // Arrange
      vi.mocked(planService.generatePlan).mockRejectedValue(new PlanNotWrittenError(jdId, sessionId));

      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(502);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Plan Generation Failed');
    });
  });

  describe('error path - AgentInvocationError', () => {
    it('should return 500 when agent invocation fails', async () => {
      // Arrange
      const cause = new Error('Network timeout');
      vi.mocked(planService.generatePlan).mockRejectedValue(new AgentInvocationError(jdId, sessionId, cause));

      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Plan Generation Error');
    });
  });

  describe('validation errors', () => {
    it('should return 400 when jdId is missing', async () => {
      // Arrange
      const event = createMockEvent(jdId, sessionId);
      event.pathParameters = {
        sessionId,
        // jdId is missing
      };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      expect(planService.generatePlan).not.toHaveBeenCalled();
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
    });

    it('should return 400 when sessionId is missing', async () => {
      // Arrange
      const event = createMockEvent(jdId, sessionId);
      event.pathParameters = {
        jdId,
        // sessionId is missing
      };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      expect(planService.generatePlan).not.toHaveBeenCalled();
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
    });

    it('should return 400 when both path parameters are missing', async () => {
      // Arrange
      const event = createMockEvent(jdId, sessionId);
      event.pathParameters = {};
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      expect(planService.generatePlan).not.toHaveBeenCalled();
    });
  });

  describe('unhandled errors', () => {
    it('should return 500 for unhandled errors', async () => {
      // Arrange
      const unhandledError = new Error('Unexpected database error');
      vi.mocked(planService.generatePlan).mockRejectedValue(unhandledError);

      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Unexpected Error');
    });
  });
});

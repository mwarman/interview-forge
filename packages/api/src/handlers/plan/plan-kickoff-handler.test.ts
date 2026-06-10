import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';
import { NotFoundError, ConflictError } from '@/errors/api-error';

// Mock dependencies BEFORE importing the handler
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  withRequestTracking: vi.fn(),
}));

vi.mock('@/services/plan-service', () => ({
  planService: {
    kickoffPlanGeneration: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  config: {},
}));

import { handle } from './plan-kickoff-handler';
import { planService } from '@/services/plan-service';

/**
 * Helper to create a mock API Gateway event with path parameters
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
    pathParameters: {
      jdId,
      sessionId,
    },
    routeKey: 'POST /jds/{jdId}/sessions/{sessionId}/plan',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'plan-kickoff-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:plan-kickoff-handler',
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

const createMockSession = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'PLAN_GENERATING',
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

describe('plan-kickoff-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('valid kickoff', () => {
    it('should successfully kickoff plan generation and return 200 with updated session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      const mockUpdatedSession = createMockSession(jdId, sessionId);

      vi.mocked(planService.kickoffPlanGeneration).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockUpdatedSession);
      expect(planService.kickoffPlanGeneration).toHaveBeenCalledWith(jdId, sessionId);
    });
  });

  describe('validation errors', () => {
    it('should return 400 when jdId is missing from path parameters', async () => {
      // Arrange
      const event = createMockEvent('', 'sessionId');
      event.pathParameters = { sessionId: 'sessionId' };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toContain('Invalid Request');
      expect(body.message).toContain('jdId');
    });

    it('should return 400 when sessionId is missing from path parameters', async () => {
      // Arrange
      const event = createMockEvent('jdId', '');
      event.pathParameters = { jdId: 'jdId' };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toContain('Invalid Request');
      expect(body.message).toContain('sessionId');
    });
  });

  describe('session not found', () => {
    it('should return 404 when session does not exist', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      vi.mocked(planService.kickoffPlanGeneration).mockRejectedValue(new NotFoundError('Session not found'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toContain('Not Found');
    });
  });

  describe('invalid session status', () => {
    it('should return 409 when session status is not valid for plan generation kickoff', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      const statusError = new ConflictError(
        'Session status PLAN_APPROVED is not valid for plan generation. Expected one of: PLAN_GENERATING, PLAN_ERROR',
      );

      vi.mocked(planService.kickoffPlanGeneration).mockRejectedValue(statusError);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toContain('Conflict');
      expect(body.message).toContain('not valid for plan generation');
    });
  });

  describe('service errors', () => {
    it('should return 500 for unhandled service errors', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      vi.mocked(planService.kickoffPlanGeneration).mockRejectedValue(new Error('DynamoDB write failed'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toContain('Unexpected Error');
    });
  });
});

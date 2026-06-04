import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/session-service', () => ({
  sessionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './get-session-handler';
import { sessionService } from '../../services/session-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (jdId?: string, sessionId?: string): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: `/jds/${jdId || 'test-jd-id'}/sessions/${sessionId || 'test-session-id'}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /jds/{jdId}/sessions/{sessionId}',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId || 'test-jd-id'}/sessions/${sessionId || 'test-session-id'}`,
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    pathParameters: jdId && sessionId ? { jdId, sessionId } : jdId ? { jdId } : sessionId ? { sessionId } : undefined,
    routeKey: 'GET /jds/{jdId}/sessions/{sessionId}',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'get-session-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:get-session-handler',
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

describe('get-session-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should successfully retrieve a session and return 200', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      const mockSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(sessionService.getById).mockResolvedValue(mockSession);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockSession);
      expect(sessionService.getById).toHaveBeenCalledWith(jdId, sessionId);
    });

    it('should include plan, scorecard, and assessment in response when present', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      const mockSession = {
        sessionId,
        jdId,
        candidateName: 'Jane Smith',
        status: 'ASSESSED',
        plan: { sectionOne: 'plan content' },
        scorecard: { score: 85 },
        assessment: { passed: true },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(sessionService.getById).mockResolvedValue(mockSession);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockSession);
      expect(body.plan).toEqual({ sectionOne: 'plan content' });
      expect(body.scorecard).toEqual({ score: 85 });
      expect(body.assessment).toEqual({ passed: true });
    });
  });

  describe('error cases', () => {
    it('should return 404 when session is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      vi.mocked(sessionService.getById).mockResolvedValue(null);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('not found');
      expect(sessionService.getById).toHaveBeenCalledWith(jdId, sessionId);
    });

    it('should return 400 when jdId parameter is missing', async () => {
      // Arrange
      const event = createMockEvent(undefined, '660f9411-f30c-42e5-b827-557766551111');
      event.pathParameters = { sessionId: '660f9411-f30c-42e5-b827-557766551111' };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('jdId path parameter is required');
      expect(sessionService.getById).not.toHaveBeenCalled();
    });

    it('should return 400 when sessionId parameter is missing', async () => {
      // Arrange
      const event = createMockEvent('550e8400-e29b-41d4-a716-446655440000', undefined);
      event.pathParameters = { jdId: '550e8400-e29b-41d4-a716-446655440000' };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('sessionId path parameter is required');
      expect(sessionService.getById).not.toHaveBeenCalled();
    });

    it('should return 400 when both jdId and sessionId parameters are missing', async () => {
      // Arrange
      const event = createMockEvent();
      event.pathParameters = undefined;
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('jdId path parameter is required');
      expect(sessionService.getById).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws an error', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const context = createMockContext();

      const testError = new Error('DynamoDB query failed');
      vi.mocked(sessionService.getById).mockRejectedValue(testError);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Retrieval Error');
      expect(body.message).toContain('unexpected error');
      expect(sessionService.getById).toHaveBeenCalledWith(jdId, sessionId);
    });
  });
});

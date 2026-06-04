import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/session-service', () => ({
  sessionService: {
    listByJdId: vi.fn(),
  },
}));

import { handle } from './list-sessions-handler';
import { sessionService } from '../../services/session-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (jdId: string | undefined = '550e8400-e29b-41d4-a716-446655440001'): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: `/jds/${jdId}/sessions`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /jds/{jdId}/sessions',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    pathParameters: jdId ? { jdId } : undefined,
    rawPath: `/jds/${jdId}/sessions`,
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    routeKey: 'GET /jds/{jdId}/sessions',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'list-sessions-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:list-sessions-handler',
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

describe('list-sessions-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should return 200 with all sessions for a JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440001';
      const mockSessions = [
        {
          sessionId: '550e8400-e29b-41d4-a716-446655440101',
          jdId,
          candidateName: 'Alice Smith',
          status: 'PLAN_PENDING',
          createdAt: '2026-06-03T10:00:00.000Z',
          TTL: 1751590800,
        },
        {
          sessionId: '550e8400-e29b-41d4-a716-446655440102',
          jdId,
          candidateName: 'Bob Johnson',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T11:00:00.000Z',
          TTL: 1751590800,
        },
      ];

      const event = createMockEvent(jdId);
      const context = createMockContext();

      vi.mocked(sessionService.listByJdId).mockResolvedValue(mockSessions);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '[]');
      expect(body).toEqual(mockSessions);
      expect(sessionService.listByJdId).toHaveBeenCalledOnce();
      expect(sessionService.listByJdId).toHaveBeenCalledWith(jdId);
    });

    it('should return 200 with empty array when no sessions exist for a JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      vi.mocked(sessionService.listByJdId).mockResolvedValue([]);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '[]');
      expect(body).toEqual([]);
      expect(sessionService.listByJdId).toHaveBeenCalledOnce();
      expect(sessionService.listByJdId).toHaveBeenCalledWith(jdId);
    });
  });

  describe('input validation', () => {
    it('should return 400 when jdId is missing from path parameters', async () => {
      // Arrange
      const event = {
        requestContext: {
          http: {
            method: 'GET',
            path: '/jds/sessions',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
          },
          routeKey: 'GET /jds/{jdId}/sessions',
          domainName: 'example.com',
          timeEpoch: Date.now(),
          requestId: 'test-req-id-123',
        },
        pathParameters: {},
        rawPath: '/jds/sessions',
        rawQueryString: '',
        headers: {},
        requestId: 'test-req-id-123',
        routeKey: 'GET /jds/{jdId}/sessions',
      } as unknown as APIGatewayProxyEventV2;
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Missing Parameter');
      expect(body.message).toBe('Path parameter "jdId" is required');
      expect(sessionService.listByJdId).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 when service throws an error', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId);
      const context = createMockContext();
      const serviceError = new Error('Database connection failed');

      vi.mocked(sessionService.listByJdId).mockRejectedValue(serviceError);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('List Error');
      expect(body.message).toBe('An unexpected error occurred while retrieving sessions');
      expect(sessionService.listByJdId).toHaveBeenCalledOnce();
      expect(sessionService.listByJdId).toHaveBeenCalledWith(jdId);
    });

    it('should return 500 when service throws an unexpected error type', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440001';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      vi.mocked(sessionService.listByJdId).mockRejectedValue('Unknown error');

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('List Error');
      expect(sessionService.listByJdId).toHaveBeenCalledOnce();
      expect(sessionService.listByJdId).toHaveBeenCalledWith(jdId);
    });
  });
});

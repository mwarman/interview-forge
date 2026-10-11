import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/session-service', () => ({
  sessionService: {
    createSession: vi.fn(),
  },
}));

import { handle } from './create-session-handler';
import * as validateMod from '../../utils/validate';
import { sessionService } from '../../services/session-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (body: Record<string, unknown>): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: '/jds/550e8400-e29b-41d4-a716-446655440000/sessions',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /jds/{jdId}/sessions',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: '/jds/550e8400-e29b-41d4-a716-446655440000/sessions',
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    body: JSON.stringify(body),
    routeKey: 'POST /jds/{jdId}/sessions',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'create-session-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:create-session-handler',
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

describe('create-session-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should successfully create a session and return 201', async () => {
      // Arrange
      const requestBody = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockResult = {
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.createSession).mockResolvedValue(mockResult);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockResult);
      expect(sessionService.createSession).toHaveBeenCalledWith(requestBody.jdId, requestBody.candidateName);
    });
  });

  describe('validation errors', () => {
    it('should return 400 when validation fails', async () => {
      // Arrange
      const event = createMockEvent({ jdId: 'not-a-uuid' });
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [
          {
            code: 'invalid_string',
            expected: 'uuid',
            received: 'string',
            message: 'Invalid input',
            path: ['jdId'],
            validation: 'uuid',
          },
        ],
        400,
      );

      vi.mocked(validateMod.parseBody).mockImplementation(() => {
        throw validationError;
      });

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Request body validation failed');
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });
  });

  describe('parent JD not found', () => {
    it('should return 404 when parent JD does not exist', async () => {
      // Arrange
      const requestBody = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.createSession).mockResolvedValue(null); // Parent JD not found

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Parent Job Description Not Found');
      expect(body.message).toContain(requestBody.jdId);
    });
  });

  describe('service errors', () => {
    it('should return 500 when service throws error', async () => {
      // Arrange
      const requestBody = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.createSession).mockRejectedValue(new Error('Database error'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Processing Error');
    });
  });
});

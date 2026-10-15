import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/session-service', () => ({
  sessionService: {
    approvePlan: vi.fn(),
  },
}));

import { handle } from './approve-plan-handler';
import * as validateMod from '../../utils/validate';
import { sessionService } from '../../services/session-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '660f9411-f30c-42e5-b827-557766551111';

/**
 * Helper to create a mock API Gateway event for PUT request
 */
const createMockEvent = (body?: Record<string, unknown>): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'PUT',
        path: `/jds/${jdId}/sessions/${sessionId}/plan/approve`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'PUT /jds/{jdId}/sessions/{sessionId}/plan/approve',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId}/sessions/${sessionId}/plan/approve`,
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestId: 'test-req-id-123',
    body: body ? JSON.stringify(body) : undefined,
    routeKey: 'PUT /jds/{jdId}/sessions/{sessionId}/plan/approve',
    pathParameters: {
      jdId,
      sessionId,
    },
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'approve-plan-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:approve-plan-handler',
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
 * Helper to create a mock session response
 */
const createMockApprovedSession = (overrides?: Partial<Record<string, unknown>>) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'PLAN_APPROVED',
  plan: {
    competencies: [
      {
        competencyId: 'comp-1',
        name: 'JavaScript',
        description: 'JavaScript expertise',
        evaluationCriteria: 'Can write clean async code',
        questions: [
          {
            questionId: 'q-1',
            text: 'Explain closures',
            type: 'TECHNICAL',
          },
        ],
      },
    ],
  },
  createdAt: '2026-06-03T12:00:00.000Z',
  TTL: 1751590800,
  ...overrides,
});

describe('approve-plan-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path - approve without modified plan', () => {
    it('should approve plan without modification and return 200', async () => {
      // Arrange
      const event = createMockEvent({}); // Empty body - no modified plan
      const context = createMockContext();
      const mockApprovalRequest = {};

      const mockApprovedSession = createMockApprovedSession();

      vi.mocked(validateMod.parseBody).mockReturnValue(mockApprovalRequest);
      vi.mocked(sessionService.approvePlan).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('PLAN_APPROVED');
      expect(sessionService.approvePlan).toHaveBeenCalledWith(jdId, sessionId, undefined);
    });
  });

  describe('happy path - approve with modified plan', () => {
    it('should approve with modified plan and return 200', async () => {
      // Arrange
      const modifiedPlan = {
        competencies: [
          {
            competencyId: 'comp-1-modified',
            name: 'Modified JavaScript',
            description: 'Modified JavaScript expertise',
            evaluationCriteria: 'Modified criteria',
            questions: [
              {
                questionId: 'q-1-modified',
                text: 'Modified closures question',
                type: 'TECHNICAL',
              },
            ],
          },
        ],
      };

      const requestBody = { plan: modifiedPlan };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockApprovedSession = createMockApprovedSession({ plan: modifiedPlan });

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.approvePlan).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('PLAN_APPROVED');
      expect(body.plan).toEqual(modifiedPlan);
      expect(sessionService.approvePlan).toHaveBeenCalledWith(jdId, sessionId, modifiedPlan);
    });
  });

  describe('path parameter validation', () => {
    it('should return 400 when jdId is missing', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      event.pathParameters = { sessionId }; // Missing jdId

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('jdId');
      expect(sessionService.approvePlan).not.toHaveBeenCalled();
    });

    it('should return 400 when sessionId is missing', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      event.pathParameters = { jdId }; // Missing sessionId

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('sessionId');
      expect(sessionService.approvePlan).not.toHaveBeenCalled();
    });

    it('should return 400 when both path parameters are missing', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      event.pathParameters = {}; // Missing both

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
    });
  });

  describe('request body validation', () => {
    it('should return 400 when plan fails schema validation', async () => {
      // Arrange
      const requestBody = { plan: { invalid: 'structure' } };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [
          {
            code: 'invalid_type',
            expected: 'array',
            received: 'undefined',
            message: 'competencies is required',
            path: ['plan', 'competencies'],
          },
        ],
        422,
      );

      vi.mocked(validateMod.parseBody).mockImplementation(() => {
        throw validationError;
      });

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Request validation failed');
      expect(sessionService.approvePlan).not.toHaveBeenCalled();
    });

    it('should accept empty body (no plan field)', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const mockApprovedSession = createMockApprovedSession();

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approvePlan).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      expect(sessionService.approvePlan).toHaveBeenCalledWith(jdId, sessionId, undefined);
    });
  });

  describe('error path - conditional check failure (already approved)', () => {
    it('should return 409 when session is already approved', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const conditionalCheckError = new ConditionalCheckFailedException({
        message: 'Condition expression evaluation failed',
        $metadata: {
          httpStatusCode: 400,
          requestId: undefined,
          attempts: 1,
          totalRetryDelay: 0,
        },
      });

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approvePlan).mockRejectedValue(conditionalCheckError);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already been approved');
    });
  });

  describe('error path - service errors', () => {
    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const serviceError = new Error('DynamoDB connection failed');

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approvePlan).mockRejectedValue(serviceError);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Approval Error');
      expect(body.message).toContain('An unexpected error occurred');
    });

    it('should return 500 when service throws unknown error type', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approvePlan).mockRejectedValue('Unknown error');

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Approval Error');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/session-service', () => ({
  sessionService: {
    approveAssessment: vi.fn(),
  },
}));

import { handle } from './approve-assessment-handler';
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
        path: `/jds/${jdId}/sessions/${sessionId}/assessment/approve`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'PUT /jds/{jdId}/sessions/{sessionId}/assessment/approve',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId}/sessions/${sessionId}/assessment/approve`,
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestId: 'test-req-id-123',
    body: body ? JSON.stringify(body) : undefined,
    routeKey: 'PUT /jds/{jdId}/sessions/{sessionId}/assessment/approve',
    pathParameters: {
      jdId,
      sessionId,
    },
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'approve-assessment-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:approve-assessment-handler',
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
 * Helper to create a mock session with assessment
 */
const createMockApprovedSession = (overrides?: Partial<Record<string, unknown>>) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'COMPLETE',
  assessment: {
    assessmentId: 'assess-1',
    recommendation: 'HIRE',
    confidence: 'HIGH',
    reasoning: 'This is a sample reasoning that meets the minimum 100 character requirement for assessment feedback',
    competencyAssessments: [
      {
        competencyId: 'comp-1',
        name: 'JavaScript',
        strengths: 'Strong async programming knowledge',
        concerns: 'Limited TypeScript experience',
        conflictsIdentified: [],
      },
    ],
    generatedAt: '2026-06-03T12:00:00.000Z',
  },
  createdAt: '2026-06-03T12:00:00.000Z',
  TTL: 1751590800,
  ...overrides,
});

describe('approve-assessment-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path - approve without overrides', () => {
    it('should approve assessment as-is and return 200', async () => {
      // Arrange
      const event = createMockEvent({}); // Empty body - no overrides
      const context = createMockContext();
      const mockApprovalRequest = {};

      const mockApprovedSession = createMockApprovedSession();

      vi.mocked(validateMod.parseBody).mockReturnValue(mockApprovalRequest);
      vi.mocked(sessionService.approveAssessment).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('COMPLETE');
      expect(body.assessment.recommendation).toBe('HIRE');
      expect(sessionService.approveAssessment).toHaveBeenCalledWith(jdId, sessionId, undefined);
    });
  });

  describe('happy path - approve with recommendation override only', () => {
    it('should approve with override recommendation and return 200', async () => {
      // Arrange
      const requestBody = { overrideRecommendation: 'STRONG_HIRE' };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockApprovedSession = createMockApprovedSession({
        assessment: {
          ...createMockApprovedSession().assessment,
          overrideRecommendation: 'STRONG_HIRE',
        },
      });

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.approveAssessment).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('COMPLETE');
      expect(body.assessment.overrideRecommendation).toBe('STRONG_HIRE');
      expect(sessionService.approveAssessment).toHaveBeenCalledWith(jdId, sessionId, requestBody);
    });
  });

  describe('happy path - approve with override reasoning only', () => {
    it('should approve with override reasoning and return 200', async () => {
      // Arrange
      const requestBody = { overrideReasoning: 'Candidate demonstrated exceptional skills in interview' };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockApprovedSession = createMockApprovedSession({
        assessment: {
          ...createMockApprovedSession().assessment,
          overrideReasoning: 'Candidate demonstrated exceptional skills in interview',
        },
      });

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.approveAssessment).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('COMPLETE');
      expect(body.assessment.overrideReasoning).toBe('Candidate demonstrated exceptional skills in interview');
      expect(sessionService.approveAssessment).toHaveBeenCalledWith(jdId, sessionId, requestBody);
    });
  });

  describe('happy path - approve with both override recommendation and override reasoning', () => {
    it('should approve with both override recommendation and override reasoning and return 200', async () => {
      // Arrange
      const requestBody = {
        overrideRecommendation: 'NO_HIRE',
        overrideReasoning: 'Candidate requested role reconsideration after interviewer feedback',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockApprovedSession = createMockApprovedSession({
        assessment: {
          ...createMockApprovedSession().assessment,
          overrideRecommendation: 'NO_HIRE',
          overrideReasoning: 'Candidate requested role reconsideration after interviewer feedback',
        },
      });

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(sessionService.approveAssessment).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body.status).toBe('COMPLETE');
      expect(body.assessment.overrideRecommendation).toBe('NO_HIRE');
      expect(body.assessment.overrideReasoning).toBe(
        'Candidate requested role reconsideration after interviewer feedback',
      );
      expect(sessionService.approveAssessment).toHaveBeenCalledWith(jdId, sessionId, requestBody);
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
      expect(sessionService.approveAssessment).not.toHaveBeenCalled();
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
      expect(sessionService.approveAssessment).not.toHaveBeenCalled();
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
      expect(sessionService.approveAssessment).not.toHaveBeenCalled();
    });
  });

  describe('request body validation', () => {
    it('should return 400 when request body fails schema validation', async () => {
      // Arrange
      const requestBody = { recommendation: 'INVALID_RECOMMENDATION' };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [
          {
            code: 'invalid_enum_value',
            options: ['HIRE', 'NO_HIRE', 'STRONG_HIRE', 'STRONG_NO_HIRE'],
            received: 'INVALID_RECOMMENDATION',
            message: 'Invalid recommendation value',
            path: ['recommendation'],
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
      expect(sessionService.approveAssessment).not.toHaveBeenCalled();
    });

    it('should accept empty body (no override fields)', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const mockApprovedSession = createMockApprovedSession();

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approveAssessment).mockResolvedValue(mockApprovedSession);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      expect(sessionService.approveAssessment).toHaveBeenCalledWith(jdId, sessionId, undefined);
    });
  });

  describe('error path - conditional check failure (status not ASSESSED)', () => {
    it('should return 409 when session is not in ASSESSED status', async () => {
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
      vi.mocked(sessionService.approveAssessment).mockRejectedValue(conditionalCheckError);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('cannot be approved');
      expect(body.message).toContain('ASSESSED');
    });
  });

  describe('error path - session not found', () => {
    it('should return 404 when session not found', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const notFoundError = new Error('Session not found: some-session-id');

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approveAssessment).mockRejectedValue(notFoundError);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Session not found');
    });
  });

  describe('error path - assessment not found in session', () => {
    it('should return 409 when assessment not found in session', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();
      const mockRequest = {};

      const assessmentNotFoundError = new Error('Assessment not found in session: some-session-id');

      vi.mocked(validateMod.parseBody).mockReturnValue(mockRequest);
      vi.mocked(sessionService.approveAssessment).mockRejectedValue(assessmentNotFoundError);

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('Assessment not found');
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
      vi.mocked(sessionService.approveAssessment).mockRejectedValue(serviceError);

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
      vi.mocked(sessionService.approveAssessment).mockRejectedValue('Unknown error');

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Approval Error');
    });
  });
});

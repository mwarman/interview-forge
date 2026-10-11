import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/session-service', () => ({
  sessionService: {
    updateScorecard: vi.fn(),
  },
}));

import { handle } from './score-handler';
import * as validateMod from '../../utils/validate';
import { sessionService } from '../../services/session-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '660f9411-f30c-42e5-b827-557766551111';

/**
 * Helper to create a mock API Gateway event for POST request
 */
const createMockEvent = (body?: Record<string, unknown>): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: `/jds/${jdId}/sessions/${sessionId}/scorecard`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /jds/{jdId}/sessions/{sessionId}/scorecard',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId}/sessions/${sessionId}/scorecard`,
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestId: 'test-req-id-123',
    body: body ? JSON.stringify(body) : undefined,
    routeKey: 'POST /jds/{jdId}/sessions/{sessionId}/scorecard',
    pathParameters: {
      jdId,
      sessionId,
    },
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'score-handler',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:score-handler',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/score-handler',
    logStreamName: '2024/01/01/[$LATEST]abc123',
    callbackWaitsForEmptyEventLoop: false,
    getRemainingTimeInMillis: () => 30000,
  }) as unknown as Context;

const mockScorecard = {
  scorecardId: '770c6633-351e-43d7-8949-779988773333',
  completedAt: '2024-01-15T10:30:00Z',
  competencyScores: [
    {
      competencyId: '880d7744-462f-54e8-9a5a-88aa99884444',
      overallNotes: 'Strong performance',
      questionRatings: [
        {
          questionId: '990e8855-573g-65f9-ab6b-99bb00995555',
          rating: 4,
          notes: 'Good understanding',
        },
      ],
    },
  ],
};

const mockSession = {
  sessionId,
  jdId,
  candidateName: 'John Doe',
  status: 'SCORED' as const,
  scorecard: mockScorecard,
  createdAt: '2024-01-10T08:00:00Z',
  TTL: 1705516800,
};

describe('ScoreHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should write scorecard and return 200 with updated session', async () => {
      // Arrange
      vi.spyOn(validateMod, 'parseBody').mockReturnValue(mockScorecard);
      vi.mocked(sessionService.updateScorecard).mockResolvedValue(mockSession);

      const event = createMockEvent(mockScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody).toEqual(mockSession);
      expect(validateMod.parseBody).toHaveBeenCalledWith(expect.any(Object), event);
      expect(sessionService.updateScorecard).toHaveBeenCalledWith(jdId, sessionId, mockScorecard);
    });
  });

  describe('path parameter validation', () => {
    it('should return 400 when jdId is missing', async () => {
      // Arrange
      const event = createMockEvent(mockScorecard);
      event.pathParameters = { sessionId };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody.error).toBe('Invalid Request');
      expect(responseBody.message).toContain('jdId');
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });

    it('should return 400 when sessionId is missing', async () => {
      // Arrange
      const event = createMockEvent(mockScorecard);
      event.pathParameters = { jdId };
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody.error).toBe('Invalid Request');
      expect(responseBody.message).toContain('sessionId');
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });

    it('should return 400 when both jdId and sessionId are missing', async () => {
      // Arrange
      const event = createMockEvent(mockScorecard);
      event.pathParameters = {};
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });
  });

  describe('request body validation', () => {
    it('should return 400 when scorecard validation fails', async () => {
      // Arrange
      const validationError = new validateMod.ValidationError(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            message: 'scorecardId is required',
            path: ['scorecardId'],
          },
        ],
        422,
      );
      vi.spyOn(validateMod, 'parseBody').mockImplementation(() => {
        throw validationError;
      });

      const event = createMockEvent({ invalid: 'scorecard' });
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody.error).toBe('Validation Error');
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });

    it('should return 400 when scorecard is missing required fields', async () => {
      // Arrange
      const invalidScorecard = { scorecardId: mockScorecard.scorecardId }; // missing completedAt, competencyScores
      const validationError = new validateMod.ValidationError(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            message: 'completedAt is required',
            path: ['completedAt'],
          },
        ],
        422,
      );

      vi.spyOn(validateMod, 'parseBody').mockImplementation(() => {
        throw validationError;
      });

      const event = createMockEvent(invalidScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });
  });

  describe('error path - conditional check failure (terminal state)', () => {
    it('should return 409 when session status is ASSESSED', async () => {
      // Arrange
      vi.spyOn(validateMod, 'parseBody').mockReturnValue(mockScorecard);
      const conditionalCheckError = new ConditionalCheckFailedException({
        message: 'Condition expression evaluation failed',
        $metadata: {
          httpStatusCode: 400,
          requestId: undefined,
          attempts: 1,
          totalRetryDelay: 0,
        },
      });
      vi.mocked(sessionService.updateScorecard).mockRejectedValue(conditionalCheckError);

      const event = createMockEvent(mockScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody.error).toBe('Conflict');
      expect(responseBody.message).toContain('scorecard has already been assessed');
    });

    it('should return 409 when session status is COMPLETE', async () => {
      // Arrange
      vi.spyOn(validateMod, 'parseBody').mockReturnValue(mockScorecard);
      const conditionalCheckError = new ConditionalCheckFailedException({
        message: 'Condition expression evaluation failed',
        $metadata: {
          httpStatusCode: 400,
          requestId: undefined,
          attempts: 1,
          totalRetryDelay: 0,
        },
      });
      vi.mocked(sessionService.updateScorecard).mockRejectedValue(conditionalCheckError);

      const event = createMockEvent(mockScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(409);
      expect(sessionService.updateScorecard).toHaveBeenCalledWith(jdId, sessionId, mockScorecard);
    });
  });

  describe('error path - service errors', () => {
    it('should return 500 when DynamoDB throws an unexpected error', async () => {
      // Arrange
      vi.spyOn(validateMod, 'parseBody').mockReturnValue(mockScorecard);
      const error = new Error('DynamoDB error');
      vi.mocked(sessionService.updateScorecard).mockRejectedValue(error);

      const event = createMockEvent(mockScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body as string);
      expect(responseBody.error).toBe('Scorecard Error');
    });

    it('should return 500 when parseBody throws non-ValidationError', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected parse error');
      vi.spyOn(validateMod, 'parseBody').mockImplementation(() => {
        throw unexpectedError;
      });

      const event = createMockEvent(mockScorecard);
      const context = createMockContext();

      // Act
      const result = (await handle(event, context)) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      expect(sessionService.updateScorecard).not.toHaveBeenCalled();
    });
  });
});

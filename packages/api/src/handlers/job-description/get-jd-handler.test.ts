import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/job-description-service', () => ({
  jobDescriptionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './get-jd-handler';
import { jobDescriptionService } from '../../services/job-description-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (jdId?: string): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: `/jds/${jdId || 'test-id'}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /jds/{jdId}',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: `/jds/${jdId || 'test-id'}`,
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    pathParameters: jdId ? { jdId } : undefined,
    routeKey: 'GET /jds/{jdId}',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'get-jd-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:get-jd-handler',
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

describe('get-jd-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should successfully retrieve a job description and return 200', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      const mockJobDescription = {
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description for a senior backend engineer.',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockJobDescription);
      expect(jobDescriptionService.getById).toHaveBeenCalledWith(jdId);
    });

    it('should include s3Key in response when present', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      const mockJobDescription = {
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description for a senior backend engineer.',
        s3Key: 'uploads/jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockJobDescription);
      expect(body.s3Key).toBe('uploads/jd-12345.pdf');
    });
  });

  describe('error cases', () => {
    it('should return 404 when job description is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      vi.mocked(jobDescriptionService.getById).mockRejectedValue(
        new Error(`Job description with ID ${jdId} not found`),
      );

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('not found');
    });

    it('should return 400 when jdId parameter is missing', async () => {
      // Arrange
      const event = createMockEvent(); // No jdId provided
      event.pathParameters = undefined; // Explicitly remove pathParameters
      const context = createMockContext();

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Invalid Request');
      expect(body.message).toContain('jdId path parameter is required');
    });

    it('should return 500 on database error', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);
      const context = createMockContext();

      vi.mocked(jobDescriptionService.getById).mockRejectedValue(new Error('DynamoDB query failed'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Retrieval Error');
      expect(body.message).toContain('unexpected error');
    });
  });
});

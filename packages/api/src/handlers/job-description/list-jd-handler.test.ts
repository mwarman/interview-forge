import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/job-description-service', () => ({
  jobDescriptionService: {
    listAll: vi.fn(),
  },
}));

import { handle } from './list-jd-handler';
import { jobDescriptionService } from '../../services/job-description-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'GET',
        path: '/jds',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'GET /jds',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: '/jds',
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    routeKey: 'GET /jds',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'list-jd-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:list-jd-handler',
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

describe('list-jd-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should return 200 with all job descriptions', async () => {
      // Arrange
      const mockJobDescriptions = [
        {
          jdId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Senior Backend Engineer',
          rawText: 'This is a job description.',
          createdAt: '2026-06-03T13:00:00.000Z',
          TTL: 1751590800,
        },
        {
          jdId: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Frontend Engineer',
          rawText: 'This is another job description.',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        },
      ];

      const event = createMockEvent();
      const context = createMockContext();

      vi.mocked(jobDescriptionService.listAll).mockResolvedValue(mockJobDescriptions);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '[]');
      expect(body).toEqual(mockJobDescriptions);
      expect(jobDescriptionService.listAll).toHaveBeenCalledOnce();
    });

    it('should return 200 with empty array when no job descriptions exist', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      vi.mocked(jobDescriptionService.listAll).mockResolvedValue([]);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body || '[]');
      expect(body).toEqual([]);
      expect(jobDescriptionService.listAll).toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    it('should return 500 when service throws an error', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();
      const serviceError = new Error('Database connection failed');

      vi.mocked(jobDescriptionService.listAll).mockRejectedValue(serviceError);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('List Error');
      expect(body.message).toBe('An unexpected error occurred while retrieving job descriptions');
      expect(jobDescriptionService.listAll).toHaveBeenCalledOnce();
    });

    it('should return 500 when service throws an unexpected error type', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      vi.mocked(jobDescriptionService.listAll).mockRejectedValue('Unknown error');

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('List Error');
      expect(jobDescriptionService.listAll).toHaveBeenCalledOnce();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/job-description-service', () => ({
  jobDescriptionService: {
    createFromPaste: vi.fn(),
    createFromUpload: vi.fn(),
  },
}));

import { handle } from './create-jd-handler';
import * as validateMod from '../../utils/validate';
import { jobDescriptionService } from '../../services/job-description-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (body: Record<string, unknown>): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: '/jds',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /jds',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: '/jds',
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    body: JSON.stringify(body),
    routeKey: 'POST /jds',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'ingest-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:ingest-handler',
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

describe('create-jd-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('paste mode', () => {
    it('should successfully ingest a job description in paste mode and return 201', async () => {
      // Arrange
      const requestBody = {
        mode: 'paste',
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description for a senior backend engineer.',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockResult = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: '2026-06-03T12:00:00.000Z',
        ttl: 1234567890,
      };

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromPaste).mockResolvedValue(mockResult);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockResult);
      expect(jobDescriptionService.createFromPaste).toHaveBeenCalledWith(requestBody.title, requestBody.rawText);
    });

    it('should return 400 when paste mode validation fails', async () => {
      // Arrange
      const event = createMockEvent({ mode: 'paste', title: 'Test' });
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [{ path: ['rawText'], message: 'required' }] as unknown as validateMod.ValidationError['issues'],
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
    });
  });

  describe('upload mode', () => {
    it('should successfully ingest a job description in upload mode and return 201', async () => {
      // Arrange
      const requestBody = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'jd-12345.pdf',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      const mockResult = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: '2026-06-03T12:00:00.000Z',
        ttl: 1234567890,
      };

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromUpload).mockResolvedValue(mockResult);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body).toEqual(mockResult);
      expect(jobDescriptionService.createFromUpload).toHaveBeenCalledWith(requestBody.title, requestBody.s3Key);
    });

    it('should return 422 when PDF extraction fails (scanned/encrypted)', async () => {
      // Arrange
      const requestBody = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'jd-scanned.pdf',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromUpload).mockRejectedValue(
        new Error('PDF appears to be scanned or encrypted and could not be parsed'),
      );

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('PDF Extraction Failed');
    });

    it('should return 400 when file not found', async () => {
      // Arrange
      const requestBody = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'nonexistent.pdf',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromUpload).mockRejectedValue(
        new Error('NoSuchKey: The specified key does not exist.'),
      );

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('File Processing Error');
    });

    it('should return 400 when unsupported file type is provided', async () => {
      // Arrange
      const requestBody = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'document.docx',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromUpload).mockRejectedValue(
        new Error('File must be a .pdf or .txt file'),
      );

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('File Processing Error');
    });
  });

  describe('error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const requestBody = {
        mode: 'paste',
        title: 'Test Job',
        rawText: 'Test description',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(jobDescriptionService.createFromPaste).mockRejectedValue(new Error('Unexpected error'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Processing Error');
    });
  });
});

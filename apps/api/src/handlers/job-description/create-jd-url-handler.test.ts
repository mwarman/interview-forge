import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

// Mock dependencies BEFORE importing the handler
vi.mock('../../utils/validate');
vi.mock('../../services/s3-service', () => ({
  s3Service: {
    getPresignedPutUrl: vi.fn(),
  },
}));

import { handle } from './create-jd-url-handler';
import * as validateMod from '../../utils/validate';
import { s3Service } from '../../services/s3-service';

/**
 * Helper to create a mock API Gateway event
 */
const createMockEvent = (body: Record<string, unknown>): APIGatewayProxyEventV2 =>
  ({
    requestContext: {
      http: {
        method: 'POST',
        path: '/jds/upload-url',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      routeKey: 'POST /jds/upload-url',
      domainName: 'example.com',
      timeEpoch: Date.now(),
      requestId: 'test-req-id-123',
    },
    rawPath: '/jds/upload-url',
    rawQueryString: '',
    headers: {},
    requestId: 'test-req-id-123',
    body: JSON.stringify(body),
    routeKey: 'POST /jds/upload-url',
  }) as unknown as APIGatewayProxyEventV2;

const createMockContext = (): Context =>
  ({
    functionName: 'create-jd-url-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:create-jd-url-handler',
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

describe('create-jd-url-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should generate a pre-signed URL and return 201 with jdId, s3Key, and presignedUrl', async () => {
      // Arrange
      const requestBody = {
        filename: 'job-description.pdf',
      };
      const event = createMockEvent(requestBody);
      const context = createMockContext();
      const mockPresignedUrl =
        'https://test-jd-bucket.s3.amazonaws.com/uploads/550e8400-e29b-41d4-a716-446655440000/job-description.pdf?X-Amz-Signature=...';

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(s3Service.getPresignedPutUrl).mockResolvedValue(mockPresignedUrl);

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body || '{}');
      expect(body).toHaveProperty('jdId');
      expect(body).toHaveProperty('s3Key');
      expect(body).toHaveProperty('presignedUrl');
      expect(body.jdId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(body.s3Key).toBe(`uploads/${body.jdId}/job-description.pdf`);
      expect(body.presignedUrl).toBe(mockPresignedUrl);
      expect(s3Service.getPresignedPutUrl).toHaveBeenCalledWith('test-bucket', body.s3Key);
    });

    it('should handle different filename formats', async () => {
      // Arrange
      const testFilenames = ['document.pdf', 'job-desc_2026.pdf', 'JD Final - v3.pdf'];

      for (const filename of testFilenames) {
        vi.clearAllMocks();
        const requestBody = { filename };
        const event = createMockEvent(requestBody);
        const context = createMockContext();
        const mockPresignedUrl = 'https://test-jd-bucket.s3.amazonaws.com/uploads/test/test.pdf';

        vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
        vi.mocked(s3Service.getPresignedPutUrl).mockResolvedValue(mockPresignedUrl);

        // Act
        const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

        // Assert
        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body || '{}');
        expect(body.s3Key).toContain(filename);
      }
    });
  });

  describe('validation errors', () => {
    it('should return 400 when filename is missing', async () => {
      // Arrange
      const event = createMockEvent({});
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [{ path: ['filename'], message: 'required' }] as unknown as validateMod.ValidationError['issues'],
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

    it('should return 400 when filename is empty', async () => {
      // Arrange
      const event = createMockEvent({ filename: '' });
      const context = createMockContext();

      const validationError = new validateMod.ValidationError(
        [{ path: ['filename'], message: 'must be non-empty' }] as unknown as validateMod.ValidationError['issues'],
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

  describe('error handling', () => {
    it('should return 500 when S3 pre-signed URL generation fails', async () => {
      // Arrange
      const requestBody = { filename: 'document.pdf' };
      const event = createMockEvent(requestBody);
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockReturnValue(requestBody);
      vi.mocked(s3Service.getPresignedPutUrl).mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('URL Generation Error');
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const event = createMockEvent({ filename: 'document.pdf' });
      const context = createMockContext();

      vi.mocked(validateMod.parseBody).mockImplementation(() => {
        throw new Error('Unexpected parsing error');
      });

      // Act
      const result = (await handle(event, context, () => {})) as APIGatewayProxyStructuredResultV2;

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('URL Generation Error');
    });
  });
});

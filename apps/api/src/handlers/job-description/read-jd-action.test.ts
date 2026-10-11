import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BedrockActionEvent, BedrockActionResponse } from '@interview-forge/shared';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/job-description-service', () => ({
  jobDescriptionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './read-jd-action';
import { jobDescriptionService } from '../../services/job-description-service';

/**
 * Helper to create a mock Bedrock action event
 */
const createMockEvent = (jdId: string): BedrockActionEvent => ({
  actionGroup: 'interview-forge-read-jd',
  function: 'read-jd-action',
  parameters: [
    {
      name: 'jdId',
      value: jdId,
    },
  ],
});

describe('read-jd-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should successfully read a job description and return Bedrock response', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);

      const mockJobDescription = {
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description for a senior backend engineer.',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-jd');
      expect(result.response.function).toBe('read-jd-action');
      expect(result.response.functionResponse).toBeDefined();
      expect(result.response.functionResponse.responseBody).toBeDefined();
      expect(result.response.functionResponse.responseBody.TEXT).toBeDefined();

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toEqual({
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description for a senior backend engineer.',
      });
      expect(jobDescriptionService.getById).toHaveBeenCalledWith(jdId);
    });

    it('should include s3Key in request when present in JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);

      const mockJobDescription = {
        jdId,
        title: 'Senior Frontend Engineer',
        rawText: 'Frontend engineer role.',
        s3Key: 'uploads/jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      // Should only include title and rawText, not s3Key
      expect(responseBody).toEqual({
        title: 'Senior Frontend Engineer',
        rawText: 'Frontend engineer role.',
      });
      expect(responseBody).not.toHaveProperty('s3Key');
    });
  });

  describe('error cases', () => {
    it('should return error response when job description is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(null);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-jd');
      expect(result.response.function).toBe('read-jd-action');

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Not Found');
      expect(responseBody.message).toContain('not found');
    });

    it('should return error response when jdId parameter is missing', async () => {
      // Arrange
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [], // No jdId parameter
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-jd');
      expect(result.response.function).toBe('read-jd-action');

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      // When jdId is missing, extractParameter returns undefined, which gets passed to service
      // Service returns null, resulting in "Not Found" error
      expect(responseBody.error).toBe('Not Found');
      expect(responseBody.message).toContain('not found');
      expect(jobDescriptionService.getById).toHaveBeenCalledWith(undefined);
    });

    it('should return error response when parameters are empty', async () => {
      // Arrange
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '', // Empty value
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(jobDescriptionService.getById).not.toHaveBeenCalled();
    });

    it('should return error response when event structure is invalid', async () => {
      // Arrange
      const invalidEvent = {
        actionGroup: 'interview-forge-read-jd',
        // Missing function and parameters
      };

      // Act
      const result = (await handle(invalidEvent)) as BedrockActionResponse;

      // Assert
      expect(result.response.functionResponse).toBeDefined();
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Invalid event structure');
    });

    it('should return error response when service throws error', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);

      vi.mocked(jobDescriptionService.getById).mockRejectedValue(new Error('DynamoDB connection failed'));

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-jd');
      expect(result.response.function).toBe('read-jd-action');

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(responseBody.message).toContain('unexpected error');
    });

    it('should return error response when parameter name does not match jdId', async () => {
      // Arrange
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jobId', // Wrong parameter name
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      // Schema validation fails because parameters don't include a 'jdId' parameter
      expect(responseBody.error).toBe('Invalid event structure');
      expect(jobDescriptionService.getById).not.toHaveBeenCalled();
    });
  });

  describe('response format', () => {
    it('should always return valid Bedrock action response format', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event = createMockEvent(jdId);

      const mockJobDescription = {
        jdId,
        title: 'Test Role',
        rawText: 'Test description',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      // Verify structure matches BedrockActionResponse
      expect(result.response).toHaveProperty('actionGroup');
      expect(result.response).toHaveProperty('function');
      expect(result.response).toHaveProperty('functionResponse');
      expect(result.response.functionResponse).toHaveProperty('responseBody');
      expect(result.response.functionResponse.responseBody).toHaveProperty('TEXT');
      expect(result.response.functionResponse.responseBody.TEXT).toHaveProperty('body');

      // Verify body is a JSON string
      const body = result.response.functionResponse.responseBody.TEXT.body;
      expect(typeof body).toBe('string');
      expect(() => JSON.parse(body)).not.toThrow();
    });

    it('should echo back actionGroup and function from request', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'custom-group',
        function: 'custom-function',
        parameters: [{ name: 'jdId', value: jdId }],
      };

      const mockJobDescription = {
        jdId,
        title: 'Test',
        rawText: 'Test',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(jobDescriptionService.getById).mockResolvedValue(mockJobDescription);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('custom-group');
      expect(result.response.function).toBe('custom-function');
    });
  });
});

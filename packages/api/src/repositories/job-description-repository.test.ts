import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jobDescriptionRepository, JobDescriptionItem } from './job-description-repository';
import { dynamoClient } from '../utils/dynamo-client';

// Mock DynamoDB client
vi.mock('../utils/dynamo-client', () => ({
  dynamoClient: {
    send: vi.fn(),
  },
}));

describe('JobDescriptionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toJobDescription', () => {
    it('should convert JobDescriptionItem to JobDescription by removing DynamoDB fields', () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description.',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      // Act
      const result = jobDescriptionRepository.toJobDescription(item);

      // Assert
      expect(result).toEqual({
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description.',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      });

      // Verify DynamoDB fields are removed
      expect(result).not.toHaveProperty('PK');
      expect(result).not.toHaveProperty('SK');
      expect(result).not.toHaveProperty('GSI1PK');
      expect(result).not.toHaveProperty('GSI1SK');
    });

    it('should preserve optional s3Key field when present', () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description.',
        s3Key: 'jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      // Act
      const result = jobDescriptionRepository.toJobDescription(item);

      // Assert
      expect(result).toEqual({
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'This is a job description.',
        s3Key: 'jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      });

      // Verify DynamoDB fields are still removed
      expect(result).not.toHaveProperty('PK');
      expect(result).not.toHaveProperty('SK');
      expect(result).not.toHaveProperty('GSI1PK');
      expect(result).not.toHaveProperty('GSI1SK');
    });

    it('should handle items with only required fields', () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#test-id',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: 'test-id',
        title: 'Test Job',
        rawText: 'Test description',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1000000,
      };

      // Act
      const result = jobDescriptionRepository.toJobDescription(item);

      // Assert
      expect(result.jdId).toBe('test-id');
      expect(result.title).toBe('Test Job');
      expect(result.rawText).toBe('Test description');
      expect(result.createdAt).toBe('2026-06-03T12:00:00.000Z');
      expect(result.TTL).toBe(1000000);
      expect(result.s3Key).toBeUndefined();
    });
  });

  describe('put', () => {
    it('should write a job description item to DynamoDB', async () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'Job description text',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({} as Record<string, unknown>);

      // Act
      await jobDescriptionRepository.put(item);

      // Assert
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Item: item,
          }),
        }),
      );
    });

    it('should write an item with s3Key to DynamoDB', async () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#test-id',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: 'test-id',
        title: 'Test Job',
        rawText: 'Text content',
        s3Key: 'uploads/jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({} as Record<string, unknown>);

      // Act
      await jobDescriptionRepository.put(item);

      // Assert
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Item: expect.objectContaining({
              s3Key: 'uploads/jd-12345.pdf',
            }),
          }),
        }),
      );
    });

    it('should throw error when DynamoDB write fails', async () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#test-id',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: 'test-id',
        title: 'Test Job',
        rawText: 'Text content',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(jobDescriptionRepository.put(item)).rejects.toThrow('DynamoDB error');
    });

    it('should preserve all item fields when writing to DynamoDB', async () => {
      // Arrange
      const item: JobDescriptionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Backend Engineer',
        rawText: 'Comprehensive job description',
        s3Key: 'jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({} as Record<string, unknown>);

      // Act
      await jobDescriptionRepository.put(item);

      // Assert
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Item: expect.objectContaining({
              PK: item.PK,
              SK: item.SK,
              GSI1PK: item.GSI1PK,
              GSI1SK: item.GSI1SK,
              jdId: item.jdId,
              title: item.title,
              rawText: item.rawText,
              s3Key: item.s3Key,
              createdAt: item.createdAt,
              TTL: item.TTL,
            }),
          }),
        }),
      );
    });
  });
});

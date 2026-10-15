import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jobDescriptionRepository, JobDescriptionItem } from './job-description-repository';
import { dynamoClient } from '../utils/dynamo-client';
import { GetCommandInput } from '@aws-sdk/lib-dynamodb';

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

      vi.mocked(dynamoClient.send).mockResolvedValue({} as unknown as void);

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

      vi.mocked(dynamoClient.send).mockResolvedValue({} as unknown as void);

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

      vi.mocked(dynamoClient.send).mockResolvedValue({} as unknown as void);

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

  describe('queryAll', () => {
    it('should query all job descriptions from GSI1 sorted by createdAt descending', async () => {
      // Arrange
      const mockItems: JobDescriptionItem[] = [
        {
          PK: 'JD#550e8400-e29b-41d4-a716-446655440001',
          SK: 'METADATA',
          GSI1PK: 'JDS',
          GSI1SK: '2026-06-03T13:00:00.000Z',
          jdId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Senior Backend Engineer',
          rawText: 'Job description 1',
          createdAt: '2026-06-03T13:00:00.000Z',
          TTL: 1234567890,
        },
        {
          PK: 'JD#550e8400-e29b-41d4-a716-446655440002',
          SK: 'METADATA',
          GSI1PK: 'JDS',
          GSI1SK: '2026-06-03T12:00:00.000Z',
          jdId: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Frontend Engineer',
          rawText: 'Job description 2',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        },
      ];

      vi.mocked(dynamoClient.send).mockResolvedValue({
        Items: mockItems,
      } as unknown as void);

      // Act
      const result = await jobDescriptionRepository.queryAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].jdId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result[1].jdId).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(result[0]).not.toHaveProperty('PK');
      expect(result[0]).not.toHaveProperty('GSI1PK');
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk',
            ScanIndexForward: false,
          }),
        }),
      );
    });

    it('should return empty array when no items exist', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({
        Items: [],
      } as unknown as void);

      // Act
      const result = await jobDescriptionRepository.queryAll();

      // Assert
      expect(result).toEqual([]);
      expect(dynamoClient.send).toHaveBeenCalledOnce();
    });

    it('should return empty array when Items is undefined', async () => {
      // Arrange
      vi.mocked(dynamoClient.send).mockResolvedValue({} as unknown as void);

      // Act
      const result = await jobDescriptionRepository.queryAll();

      // Assert
      expect(result).toEqual([]);
      expect(dynamoClient.send).toHaveBeenCalledOnce();
    });

    it('should throw error when DynamoDB query fails', async () => {
      // Arrange
      const error = new Error('Query failed');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(jobDescriptionRepository.queryAll()).rejects.toThrow('Query failed');
    });

    it('should convert DynamoDB items to JobDescription objects', async () => {
      // Arrange
      const mockItems: JobDescriptionItem[] = [
        {
          PK: 'JD#test-id',
          SK: 'METADATA',
          GSI1PK: 'JDS',
          GSI1SK: '2026-06-03T12:00:00.000Z',
          jdId: 'test-id',
          title: 'Test Job',
          rawText: 'Test description',
          s3Key: 'uploads/file.pdf',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        },
      ];

      vi.mocked(dynamoClient.send).mockResolvedValue({
        Items: mockItems,
      } as unknown as void);

      // Act
      const result = await jobDescriptionRepository.queryAll();

      // Assert
      expect(result).toHaveLength(1);
      const jd = result[0];
      expect(jd.jdId).toBe('test-id');
      expect(jd.title).toBe('Test Job');
      expect(jd.rawText).toBe('Test description');
      expect(jd.s3Key).toBe('uploads/file.pdf');
      expect(jd.createdAt).toBe('2026-06-03T12:00:00.000Z');
      expect(jd.TTL).toBe(1234567890);
    });
  });

  describe('getById', () => {
    it('should retrieve a single job description by ID', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const mockItem: JobDescriptionItem = {
        PK: `JD#${jdId}`,
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'Job description text',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({
        Item: mockItem,
      } as unknown as void);

      // Act
      const result = await jobDescriptionRepository.getById(jdId);

      // Assert
      expect(result).toEqual({
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'Job description text',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      });
      expect(result).not.toHaveProperty('PK');
      expect(result).not.toHaveProperty('GSI1PK');
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: {
              PK: `JD#${jdId}`,
              SK: 'METADATA',
            },
          }),
        }),
      );
    });

    it('should retrieve a job description with s3Key', async () => {
      // Arrange
      const jdId = 'test-id';
      const mockItem: JobDescriptionItem = {
        PK: `JD#${jdId}`,
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: '2026-06-03T12:00:00.000Z',
        jdId,
        title: 'Test Job',
        rawText: 'Test description',
        s3Key: 'uploads/jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({
        Item: mockItem,
      } as unknown as void);

      // Act
      const result = await jobDescriptionRepository.getById(jdId);

      // Assert
      expect(result).toEqual({
        jdId,
        title: 'Test Job',
        rawText: 'Test description',
        s3Key: 'uploads/jd-12345.pdf',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1234567890,
      });
      expect(result?.s3Key).toBe('uploads/jd-12345.pdf');
    });

    it('should return null when item is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(dynamoClient.send).mockResolvedValue({} as unknown as void);

      // Act
      const result = await jobDescriptionRepository.getById(jdId);

      // Assert
      expect(result).toBeNull();
      expect(dynamoClient.send).toHaveBeenCalledOnce();
    });

    it('should throw error when DynamoDB get fails', async () => {
      // Arrange
      const jdId = 'test-id';
      const error = new Error('DynamoDB error');
      vi.mocked(dynamoClient.send).mockRejectedValue(error);

      // Act & Assert
      await expect(jobDescriptionRepository.getById(jdId)).rejects.toThrow('DynamoDB error');
    });

    it('should call GetCommand with correct parameters', async () => {
      // Arrange
      const jdId = 'specific-id';
      vi.mocked(dynamoClient.send).mockResolvedValue({
        Item: {
          PK: `JD#${jdId}`,
          SK: 'METADATA',
          GSI1PK: 'JDS',
          GSI1SK: '2026-06-03T12:00:00.000Z',
          jdId,
          title: 'Test',
          rawText: 'Test',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        },
      } as unknown as void);

      // Act
      await jobDescriptionRepository.getById(jdId);

      // Assert
      const callArgs = vi.mocked(dynamoClient.send).mock.calls[0][0];
      const input = callArgs.input as GetCommandInput;
      expect(input.Key).toEqual({
        PK: `JD#${jdId}`,
        SK: 'METADATA',
      });
    });
  });
});

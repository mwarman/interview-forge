import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionRepository, SessionItem } from './session-repository';
import { dynamoClient } from '../utils/dynamo-client';

// Mock DynamoDB client
vi.mock('../utils/dynamo-client', () => ({
  dynamoClient: {
    send: vi.fn(),
  },
}));

describe('SessionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toSession', () => {
    it('should convert SessionItem to Session by removing DynamoDB fields', () => {
      // Arrange
      const item: SessionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      // Act
      const result = sessionRepository.toSession(item);

      // Assert
      expect(result).toEqual({
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      });

      // Verify DynamoDB fields are removed
      expect(result).not.toHaveProperty('PK');
      expect(result).not.toHaveProperty('SK');
    });

    it('should preserve optional fields when present', () => {
      // Arrange
      const item: SessionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'Jane Doe',
        status: 'SCORED',
        plan: { step: 1 },
        scorecard: { score: 85 },
        assessment: { notes: 'Good candidate' },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      // Act
      const result = sessionRepository.toSession(item);

      // Assert
      expect(result).toEqual({
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'Jane Doe',
        status: 'SCORED',
        plan: { step: 1 },
        scorecard: { score: 85 },
        assessment: { notes: 'Good candidate' },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      });
    });
  });

  describe('put', () => {
    it('should write a session item to DynamoDB', async () => {
      // Arrange
      const item: SessionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      await sessionRepository.put(item);

      // Assert
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: expect.any(String),
            Item: item,
          },
        }),
      );
    });

    it('should throw error when DynamoDB write fails', async () => {
      // Arrange
      const item: SessionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(sessionRepository.put(item)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getById', () => {
    it('should fetch a session by jdId and sessionId', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const item: SessionItem = {
        PK: `JD#${jdId}`,
        SK: `SESSION#${sessionId}`,
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({ Item: item });

      // Act
      const result = await sessionRepository.getById(jdId, sessionId);

      // Assert
      expect(result).toEqual({
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      });

      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: expect.any(String),
            Key: {
              PK: `JD#${jdId}`,
              SK: `SESSION#${sessionId}`,
            },
          },
        }),
      );
    });

    it('should return null when session not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';

      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      const result = await sessionRepository.getById(jdId, sessionId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when DynamoDB get fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';

      vi.mocked(dynamoClient.send).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(sessionRepository.getById(jdId, sessionId)).rejects.toThrow('DynamoDB error');
    });
  });
});

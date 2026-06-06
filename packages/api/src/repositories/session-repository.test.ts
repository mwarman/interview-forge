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
        GSI1PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        GSI1SK: 'SESSION#2026-06-03T12:00:00.000Z#660f9411-f30c-42e5-b827-557766551111',
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
      expect(result).not.toHaveProperty('GSI1PK');
      expect(result).not.toHaveProperty('GSI1SK');
    });

    it('should preserve optional fields when present', () => {
      // Arrange
      const item: SessionItem = {
        PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
        GSI1PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        GSI1SK: 'SESSION#2026-06-03T12:00:00.000Z#660f9411-f30c-42e5-b827-557766551111',
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
        GSI1PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        GSI1SK: 'SESSION#2026-06-03T12:00:00.000Z#660f9411-f30c-42e5-b827-557766551111',
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
        GSI1PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
        GSI1SK: 'SESSION#2026-06-03T12:00:00.000Z#660f9411-f30c-42e5-b827-557766551111',
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
        GSI1PK: `JD#${jdId}`,
        GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
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

  describe('queryByJdId', () => {
    it('should fetch all sessions for a JD sorted by createdAt ascending', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const items: SessionItem[] = [
        {
          PK: `JD#${jdId}`,
          SK: 'SESSION#660f9411-f30c-42e5-b827-557766551111',
          GSI1PK: `JD#${jdId}`,
          GSI1SK: 'SESSION#2026-06-03T10:00:00.000Z#660f9411-f30c-42e5-b827-557766551111',
          sessionId: '660f9411-f30c-42e5-b827-557766551111',
          jdId,
          candidateName: 'Alice',
          status: 'PLAN_PENDING',
          createdAt: '2026-06-03T10:00:00.000Z',
          TTL: 1751590800,
        },
        {
          PK: `JD#${jdId}`,
          SK: 'SESSION#770g0522-g41d-53f6-c938-668877662222',
          GSI1PK: `JD#${jdId}`,
          GSI1SK: 'SESSION#2026-06-03T11:00:00.000Z#770g0522-g41d-53f6-c938-668877662222',
          sessionId: '770g0522-g41d-53f6-c938-668877662222',
          jdId,
          candidateName: 'Bob',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T11:00:00.000Z',
          TTL: 1751590800,
        },
      ];

      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: items });

      // Act
      const result = await sessionRepository.queryByJdId(jdId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        sessionId: '660f9411-f30c-42e5-b827-557766551111',
        jdId,
        candidateName: 'Alice',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T10:00:00.000Z',
        TTL: 1751590800,
      });
      expect(result[1]).toEqual({
        sessionId: '770g0522-g41d-53f6-c938-668877662222',
        jdId,
        candidateName: 'Bob',
        status: 'PLAN_APPROVED',
        createdAt: '2026-06-03T11:00:00.000Z',
        TTL: 1751590800,
      });

      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: expect.any(String),
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk_prefix)',
            ExpressionAttributeValues: {
              ':gsi1pk': `JD#${jdId}`,
              ':gsi1sk_prefix': 'SESSION#',
            },
            ScanIndexForward: true,
          },
        }),
      );
    });

    it('should return empty array when no sessions exist for a JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(dynamoClient.send).mockResolvedValue({ Items: [] });

      // Act
      const result = await sessionRepository.queryByJdId(jdId);

      // Assert
      expect(result).toEqual([]);

      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: expect.any(String),
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk_prefix)',
            ExpressionAttributeValues: {
              ':gsi1pk': `JD#${jdId}`,
              ':gsi1sk_prefix': 'SESSION#',
            },
            ScanIndexForward: true,
          },
        }),
      );
    });

    it('should return empty array when result has no Items', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act
      const result = await sessionRepository.queryByJdId(jdId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when DynamoDB query fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(dynamoClient.send).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(sessionRepository.queryByJdId(jdId)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('updateById', () => {
    it('should update a session with new values and return updated session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = {
        status: 'PLAN_APPROVED',
        plan: { competencies: [{ id: '123' }] },
      };

      const updatedItem: SessionItem = {
        PK: `JD#${jdId}`,
        SK: `SESSION#${sessionId}`,
        GSI1PK: `JD#${jdId}`,
        GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_APPROVED',
        plan: { competencies: [{ id: '123' }] },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

      // Act
      const result = await sessionRepository.updateById(jdId, sessionId, updates);

      // Assert
      expect(result).toEqual({
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_APPROVED',
        plan: { competencies: [{ id: '123' }] },
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
            UpdateExpression: expect.stringContaining('SET'),
            ExpressionAttributeValues: expect.objectContaining({
              ':val0': 'PLAN_APPROVED',
              ':val1': { competencies: [{ id: '123' }] },
            }),
            ReturnValues: 'ALL_NEW',
          },
        }),
      );
    });

    it('should update multiple fields independently', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = {
        status: 'SCORED',
        scorecard: { score: 95 },
        assessment: { result: 'passed' },
      };

      const updatedItem: SessionItem = {
        PK: `JD#${jdId}`,
        SK: `SESSION#${sessionId}`,
        GSI1PK: `JD#${jdId}`,
        GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
        sessionId,
        jdId,
        candidateName: 'Jane Doe',
        status: 'SCORED',
        scorecard: { score: 95 },
        assessment: { result: 'passed' },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

      // Act
      const result = await sessionRepository.updateById(jdId, sessionId, updates);

      // Assert
      expect(result.status).toBe('SCORED');
      expect(result.scorecard).toEqual({ score: 95 });
      expect(result.assessment).toEqual({ result: 'passed' });
    });

    it('should throw error when DynamoDB update fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = { status: 'PLAN_APPROVED' };

      vi.mocked(dynamoClient.send).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(sessionRepository.updateById(jdId, sessionId, updates)).rejects.toThrow('DynamoDB error');
    });

    it('should throw error when Attributes are not returned', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = { status: 'PLAN_APPROVED' };

      vi.mocked(dynamoClient.send).mockResolvedValue({});

      // Act & Assert
      await expect(sessionRepository.updateById(jdId, sessionId, updates)).rejects.toThrow(
        'Updated item not returned from DynamoDB',
      );
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { InterviewPlan } from '@interview-forge/shared';

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

  describe('updateWithApprovedPlan', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660f9411-f30c-42e5-b827-557766551111';

    describe('happy path - approving without modified plan', () => {
      it('should update status to PLAN_APPROVED without modifying plan', async () => {
        // Arrange
        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        const result = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined);

        // Assert
        expect(result).toEqual({
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        });

        // Verify the update expression does not include plan
        expect(dynamoClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: {
              TableName: expect.any(String),
              Key: {
                PK: `JD#${jdId}`,
                SK: `SESSION#${sessionId}`,
              },
              UpdateExpression: 'SET #s = :approved',
              ExpressionAttributeNames: {
                '#s': 'status',
              },
              ExpressionAttributeValues: {
                ':approved': 'PLAN_APPROVED',
                ':pending': 'PLAN_PENDING',
              },
              ConditionExpression: '#s = :pending',
              ReturnValues: 'ALL_NEW',
            },
          }),
        );
      });

      it('should throw error when status is not PLAN_PENDING', async () => {
        // Arrange
        const conditionalError = new Error('ConditionalCheckFailedException');
        vi.mocked(dynamoClient.send).mockRejectedValue(conditionalError);

        // Act & Assert
        await expect(sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined)).rejects.toThrow(
          'ConditionalCheckFailedException',
        );
      });
    });

    describe('happy path - approving with modified plan', () => {
      it('should update status to PLAN_APPROVED and replace plan', async () => {
        // Arrange
        const modifiedPlan = {
          rounds: 4,
          duration: '90 minutes',
          interviewers: ['Alice', 'Bob'],
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
          plan: modifiedPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        const result = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, modifiedPlan);

        // Assert
        expect(result).toEqual({
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: modifiedPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        });
        expect(result.plan).toEqual(modifiedPlan);

        // Verify the update expression includes plan
        expect(dynamoClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: {
              TableName: expect.any(String),
              Key: {
                PK: `JD#${jdId}`,
                SK: `SESSION#${sessionId}`,
              },
              UpdateExpression: expect.stringContaining('#s = :approved'),
              UpdateExpression: expect.stringContaining('plan = :plan'),
              ExpressionAttributeNames: {
                '#s': 'status',
              },
              ExpressionAttributeValues: {
                ':approved': 'PLAN_APPROVED',
                ':pending': 'PLAN_PENDING',
                ':plan': modifiedPlan,
              },
              ConditionExpression: '#s = :pending',
              ReturnValues: 'ALL_NEW',
            },
          }),
        );
      });

      it('should handle complex nested plan structure', async () => {
        // Arrange
        const complexPlan = {
          rounds: 3,
          stages: [
            {
              name: 'Technical Round 1',
              duration: 60,
              topics: ['React', 'TypeScript'],
              interviewers: [
                { name: 'Alice', expertise: 'Frontend' },
                { name: 'Bob', expertise: 'Backend' },
              ],
            },
            {
              name: 'Behavioral Round',
              duration: 45,
              interviewers: [{ name: 'Charlie', expertise: 'HR' }],
            },
          ],
        };

        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'Jane Smith',
          status: 'PLAN_APPROVED',
          plan: complexPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        const result = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, complexPlan);

        // Assert
        expect(result.plan).toEqual(complexPlan);
        expect(result.plan).toHaveProperty('stages');
        expect((result.plan as InterviewPlan).stages).toHaveLength(2);
      });

      it('should handle empty plan object', async () => {
        // Arrange
        const emptyPlan = {};

        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: emptyPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        const result = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, emptyPlan);

        // Assert
        expect(result.plan).toEqual({});
      });
    });

    describe('error cases', () => {
      it('should throw error when DynamoDB update fails', async () => {
        // Arrange
        vi.mocked(dynamoClient.send).mockRejectedValue(new Error('DynamoDB update error'));

        // Act & Assert
        await expect(sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined)).rejects.toThrow(
          'DynamoDB update error',
        );
      });

      it('should throw error when Attributes are not returned', async () => {
        // Arrange
        vi.mocked(dynamoClient.send).mockResolvedValue({});

        // Act & Assert
        await expect(sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined)).rejects.toThrow(
          'Updated item not returned from DynamoDB',
        );
      });

      it('should throw ConditionalCheckFailedException when session status is not PLAN_PENDING', async () => {
        // Arrange
        const error = new Error('ConditionalCheckFailedException: The conditional request failed');
        error.name = 'ConditionalCheckFailedException';
        vi.mocked(dynamoClient.send).mockRejectedValue(error);

        // Act & Assert
        await expect(sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined)).rejects.toThrow(
          'ConditionalCheckFailedException',
        );
      });

      it('should propagate generic DynamoDB errors', async () => {
        // Arrange
        const dbError = new Error('Internal server error');
        vi.mocked(dynamoClient.send).mockRejectedValue(dbError);

        // Act & Assert
        await expect(sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined)).rejects.toThrow(
          'Internal server error',
        );
      });
    });

    describe('idempotency and status validation', () => {
      it('should use correct condition expression for status check', async () => {
        // Arrange
        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        await sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined);

        // Assert
        expect(dynamoClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              ConditionExpression: '#s = :pending',
              ExpressionAttributeValues: expect.objectContaining({
                ':pending': 'PLAN_PENDING',
                ':approved': 'PLAN_APPROVED',
              }),
            }),
          }),
        );
      });

      it('should preserve all other session fields during update', async () => {
        // Arrange
        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          scorecard: undefined,
          assessment: undefined,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        const result = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined);

        // Assert
        expect(result.sessionId).toBe(sessionId);
        expect(result.jdId).toBe(jdId);
        expect(result.candidateName).toBe('John Doe');
        expect(result.createdAt).toBe(updatedItem.createdAt);
        expect(result.TTL).toBe(updatedItem.TTL);
      });
    });

    describe('key construction and DynamoDB interaction', () => {
      it('should use correct partition and sort keys', async () => {
        // Arrange
        const customJdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        const customSessionId = 'ffffffff-1111-2222-3333-444444444444';

        const updatedItem: SessionItem = {
          PK: `JD#${customJdId}`,
          SK: `SESSION#${customSessionId}`,
          GSI1PK: `JD#${customJdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${customSessionId}`,
          sessionId: customSessionId,
          jdId: customJdId,
          candidateName: 'Test User',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        await sessionRepository.updateWithApprovedPlan(customJdId, customSessionId, undefined);

        // Assert
        expect(dynamoClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: {
              TableName: expect.any(String),
              Key: {
                PK: `JD#${customJdId}`,
                SK: `SESSION#${customSessionId}`,
              },
              UpdateExpression: expect.any(String),
              ExpressionAttributeNames: expect.any(Object),
              ExpressionAttributeValues: expect.any(Object),
              ConditionExpression: expect.any(String),
              ReturnValues: 'ALL_NEW',
            },
          }),
        );
      });

      it('should return ALL_NEW to ensure updated item is returned', async () => {
        // Arrange
        const updatedItem: SessionItem = {
          PK: `JD#${jdId}`,
          SK: `SESSION#${sessionId}`,
          GSI1PK: `JD#${jdId}`,
          GSI1SK: `SESSION#2026-06-03T12:00:00.000Z#${sessionId}`,
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        };

        vi.mocked(dynamoClient.send).mockResolvedValue({ Attributes: updatedItem });

        // Act
        await sessionRepository.updateWithApprovedPlan(jdId, sessionId, undefined);

        // Assert
        expect(dynamoClient.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              ReturnValues: 'ALL_NEW',
            }),
          }),
        );
      });
    });
  });
});

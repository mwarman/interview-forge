import { describe, it, expect, beforeEach, vi } from 'vitest';

import { sessionService } from '@/services/session-service';
import { jobDescriptionRepository } from '@/repositories/job-description-repository';
import { sessionRepository } from '@/repositories/session-repository';

// Mock dependencies
vi.mock('@/repositories/job-description-repository', () => ({
  jobDescriptionRepository: {
    getById: vi.fn(),
  },
}));

vi.mock('@/repositories/session-repository', () => ({
  sessionRepository: {
    put: vi.fn(),
    queryByJdId: vi.fn(),
    getById: vi.fn(),
    updateById: vi.fn(),
    updateWithApprovedPlan: vi.fn(),
    toSession: vi.fn((item) => {
      const { PK: _pk, SK: _sk, ...session } = item;
      return session;
    }),
  },
}));

vi.mock('crypto', () => ({
  randomUUID: () => '770a0522-g40d-52f6-c938-668877662222',
}));

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with TTL copied from parent JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const candidateName = 'John Doe';
      const parentJd = {
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'Job description text',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(jobDescriptionRepository.getById).mockResolvedValue(parentJd);
      vi.mocked(sessionRepository.put).mockResolvedValue(undefined);

      // Act
      const result = await sessionService.createSession(jdId, candidateName);

      // Assert
      expect(result).toBeDefined();
      expect(result?.sessionId).toBe('770a0522-g40d-52f6-c938-668877662222');
      expect(result?.jdId).toBe(jdId);
      expect(result?.candidateName).toBe(candidateName);
      expect(result?.status).toBe('PLAN_PENDING');
      expect(result?.TTL).toBe(parentJd.TTL); // TTL copied from parent
      expect(result).toHaveProperty('createdAt');

      // Verify repository was called with correct structure
      expect(sessionRepository.put).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '770a0522-g40d-52f6-c938-668877662222',
          jdId,
          candidateName,
          PK: `JD#${jdId}`,
          SK: 'SESSION#770a0522-g40d-52f6-c938-668877662222',
          status: 'PLAN_PENDING',
          TTL: parentJd.TTL,
        }),
      );
    });

    it('should return null when parent JD not found', async () => {
      // Arrange
      const jdId = 'nonexistent-id';
      const candidateName = 'John Doe';

      vi.mocked(jobDescriptionRepository.getById).mockResolvedValue(null);

      // Act
      const result = await sessionService.createSession(jdId, candidateName);

      // Assert
      expect(result).toBeNull();
      expect(sessionRepository.put).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const candidateName = 'John Doe';
      const parentJd = {
        jdId,
        title: 'Senior Backend Engineer',
        rawText: 'Job description text',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(jobDescriptionRepository.getById).mockResolvedValue(parentJd);
      vi.mocked(sessionRepository.put).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(sessionService.createSession(jdId, candidateName)).rejects.toThrow('DynamoDB error');
    });

    it('should throw error when fetching parent JD fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const candidateName = 'John Doe';

      vi.mocked(jobDescriptionRepository.getById).mockRejectedValue(new Error('DynamoDB query error'));

      // Act & Assert
      await expect(sessionService.createSession(jdId, candidateName)).rejects.toThrow('DynamoDB query error');
    });
  });

  describe('listByJdId', () => {
    it('should return all sessions for a JD sorted by createdAt ascending', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessions = [
        {
          sessionId: '660f9411-f30c-42e5-b827-557766551111',
          jdId,
          candidateName: 'Alice',
          status: 'PLAN_PENDING',
          createdAt: '2026-06-03T10:00:00.000Z',
          TTL: 1751590800,
        },
        {
          sessionId: '770g0522-g41d-53f6-c938-668877662222',
          jdId,
          candidateName: 'Bob',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T11:00:00.000Z',
          TTL: 1751590800,
        },
      ];

      vi.mocked(sessionRepository.queryByJdId).mockResolvedValue(sessions);

      // Act
      const result = await sessionService.listByJdId(jdId);

      // Assert
      expect(result).toEqual(sessions);
      expect(result).toHaveLength(2);
      expect(result[0].candidateName).toBe('Alice');
      expect(result[1].candidateName).toBe('Bob');
      expect(sessionRepository.queryByJdId).toHaveBeenCalledWith(jdId);
      expect(sessionRepository.queryByJdId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no sessions exist for a JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(sessionRepository.queryByJdId).mockResolvedValue([]);

      // Act
      const result = await sessionService.listByJdId(jdId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(sessionRepository.queryByJdId).toHaveBeenCalledWith(jdId);
    });

    it('should throw error when repository query fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(sessionRepository.queryByJdId).mockRejectedValue(new Error('DynamoDB query error'));

      // Act & Assert
      await expect(sessionService.listByJdId(jdId)).rejects.toThrow('DynamoDB query error');
      expect(sessionRepository.queryByJdId).toHaveBeenCalledWith(jdId);
    });

    it('should return single session when only one exists for a JD', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessions = [
        {
          sessionId: '660f9411-f30c-42e5-b827-557766551111',
          jdId,
          candidateName: 'Charlie',
          status: 'PLAN_COMPLETED',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1751590800,
        },
      ];

      vi.mocked(sessionRepository.queryByJdId).mockResolvedValue(sessions);

      // Act
      const result = await sessionService.listByJdId(jdId);

      // Assert
      expect(result).toEqual(sessions);
      expect(result).toHaveLength(1);
      expect(result[0].candidateName).toBe('Charlie');
    });
  });

  describe('getById', () => {
    it('should return a session when found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const mockSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSession);

      // Act
      const result = await sessionService.getById(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSession);
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.getById).toHaveBeenCalledTimes(1);
    });

    it('should return null when session is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = 'nonexistent-session-id';

      vi.mocked(sessionRepository.getById).mockResolvedValue(null);

      // Act
      const result = await sessionService.getById(jdId, sessionId);

      // Assert
      expect(result).toBeNull();
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
    });

    it('should return session with all optional fields when present', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const mockSession = {
        sessionId,
        jdId,
        candidateName: 'Jane Smith',
        status: 'ASSESSED',
        plan: { section1: 'content' },
        scorecard: { score: 90 },
        assessment: { passed: true },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSession);

      // Act
      const result = await sessionService.getById(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSession);
      expect(result?.plan).toEqual({ section1: 'content' });
      expect(result?.scorecard).toEqual({ score: 90 });
      expect(result?.assessment).toEqual({ passed: true });
    });

    it('should throw error when repository get fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';

      vi.mocked(sessionRepository.getById).mockRejectedValue(new Error('DynamoDB get error'));

      // Act & Assert
      await expect(sessionService.getById(jdId, sessionId)).rejects.toThrow('DynamoDB get error');
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
    });
  });

  describe('updateSession', () => {
    it('should update session with provided updates and return updated session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = {
        status: 'PLAN_APPROVED',
        plan: { competencies: [{ id: 'comp-1' }] },
      };

      const updatedSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_APPROVED',
        plan: { competencies: [{ id: 'comp-1' }] },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);

      // Act
      const result = await sessionService.updateSession(jdId, sessionId, updates);

      // Assert
      expect(result).toEqual(updatedSession);
      expect(result.status).toBe('PLAN_APPROVED');
      expect(result.plan).toEqual({ competencies: [{ id: 'comp-1' }] });
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, updates);
      expect(sessionRepository.updateById).toHaveBeenCalledTimes(1);
    });

    it('should update only status field', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = { status: 'SCORED' };

      const updatedSession = {
        sessionId,
        jdId,
        candidateName: 'Jane Doe',
        status: 'SCORED',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);

      // Act
      const result = await sessionService.updateSession(jdId, sessionId, updates);

      // Assert
      expect(result.status).toBe('SCORED');
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, updates);
    });

    it('should update multiple fields simultaneously', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = {
        status: 'ASSESSED',
        scorecard: { score: 95 },
        assessment: { result: 'passed' },
      };

      const updatedSession = {
        sessionId,
        jdId,
        candidateName: 'Bob Smith',
        status: 'ASSESSED',
        scorecard: { score: 95 },
        assessment: { result: 'passed' },
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);

      // Act
      const result = await sessionService.updateSession(jdId, sessionId, updates);

      // Assert
      expect(result.status).toBe('ASSESSED');
      expect(result.scorecard).toEqual({ score: 95 });
      expect(result.assessment).toEqual({ result: 'passed' });
    });

    it('should throw error when repository update fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const updates = { status: 'PLAN_APPROVED' };

      vi.mocked(sessionRepository.updateById).mockRejectedValue(new Error('DynamoDB update error'));

      // Act & Assert
      await expect(sessionService.updateSession(jdId, sessionId, updates)).rejects.toThrow('DynamoDB update error');
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, updates);
    });
  });

  describe('approvePlan', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660f9411-f30c-42e5-b827-557766551111';

    describe('happy path - approving without modified plan', () => {
      it('should approve an existing plan and return updated session', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        const result = await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(result).toEqual(mockSession);
        expect(result.status).toBe('PLAN_APPROVED');
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, undefined);
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledOnce();
      });

      it('should log appropriately when approving without modification', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'Jane Smith',
          status: 'PLAN_APPROVED',
          plan: { rounds: 2 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, undefined);
      });
    });

    describe('happy path - approving with modified plan', () => {
      it('should approve with a modified plan and return updated session', async () => {
        // Arrange
        const modifiedPlan = {
          rounds: 4,
          duration: '90 minutes',
          interviewers: ['Alice', 'Bob'],
        };

        const request = {
          plan: modifiedPlan,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: modifiedPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        const result = await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(result).toEqual(mockSession);
        expect(result.plan).toEqual(modifiedPlan);
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, modifiedPlan);
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledOnce();
      });

      it('should pass complex modified plan to repository', async () => {
        // Arrange
        const modifiedPlan = {
          rounds: 3,
          stages: [
            {
              name: 'Technical Round 1',
              duration: 60,
              topics: ['React', 'TypeScript'],
            },
            {
              name: 'Behavioral Round',
              duration: 45,
            },
          ],
        };

        const request = {
          plan: modifiedPlan,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'Jane Smith',
          status: 'PLAN_APPROVED',
          plan: modifiedPlan,
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, modifiedPlan);
      });
    });

    describe('error cases', () => {
      it('should propagate ConditionalCheckFailedException from repository', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const conditionalError = new Error('ConditionalCheckFailedException');
        conditionalError.name = 'ConditionalCheckFailedException';

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockRejectedValue(conditionalError);

        // Act & Assert
        await expect(sessionService.approvePlan(jdId, sessionId, request)).rejects.toThrow(
          'ConditionalCheckFailedException',
        );
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, undefined);
      });

      it('should propagate generic repository error', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const repositoryError = new Error('DynamoDB update failed');

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockRejectedValue(repositoryError);

        // Act & Assert
        await expect(sessionService.approvePlan(jdId, sessionId, request)).rejects.toThrow('DynamoDB update failed');
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledOnce();
      });

      it('should handle session not found error', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const notFoundError = new Error('Item not found');

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockRejectedValue(notFoundError);

        // Act & Assert
        await expect(sessionService.approvePlan(jdId, sessionId, request)).rejects.toThrow('Item not found');
      });
    });

    describe('status validation', () => {
      it('should return session with PLAN_APPROVED status', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        const result = await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(result.status).toBe('PLAN_APPROVED');
      });

      it('should preserve session metadata in returned result', async () => {
        // Arrange
        const request = {
          plan: undefined,
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: { rounds: 3 },
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        const result = await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(result.sessionId).toBe(sessionId);
        expect(result.jdId).toBe(jdId);
        expect(result.candidateName).toBe('John Doe');
        expect(result.createdAt).toBe(mockSession.createdAt);
        expect(result.TTL).toBe(mockSession.TTL);
      });
    });

    describe('input parameter handling', () => {
      it('should correctly pass jdId and sessionId to repository', async () => {
        // Arrange
        const customJdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        const customSessionId = 'ffffffff-1111-2222-3333-444444444444';
        const request = {
          plan: undefined,
        };

        const mockSession = {
          sessionId: customSessionId,
          jdId: customJdId,
          candidateName: 'Test User',
          status: 'PLAN_APPROVED',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        await sessionService.approvePlan(customJdId, customSessionId, request);

        // Assert
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(customJdId, customSessionId, undefined);
      });

      it('should handle empty plan object', async () => {
        // Arrange
        const request = {
          plan: {},
        };

        const mockSession = {
          sessionId,
          jdId,
          candidateName: 'John Doe',
          status: 'PLAN_APPROVED',
          plan: {},
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        };

        vi.mocked(sessionRepository.updateWithApprovedPlan).mockResolvedValue(mockSession);

        // Act
        await sessionService.approvePlan(jdId, sessionId, request);

        // Assert
        expect(sessionRepository.updateWithApprovedPlan).toHaveBeenCalledWith(jdId, sessionId, {});
      });
    });
  });
});

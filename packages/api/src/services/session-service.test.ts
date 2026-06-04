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
});

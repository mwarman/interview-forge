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
});

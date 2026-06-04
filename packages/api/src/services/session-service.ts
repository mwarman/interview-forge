import { randomUUID } from 'crypto';

import { Session } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { jobDescriptionRepository } from '@/repositories/job-description-repository';
import { sessionRepository, SessionItem } from '@/repositories/session-repository';

/**
 * Service for Session business logic
 * Encapsulates the orchestration of creating and persisting sessions
 */
export class SessionService {
  /**
   * Create a new session under a parent Job Description
   * Reads the parent JD's TTL and copies it to the new session
   * @param jdId - The unique identifier of the parent job description
   * @param candidateName - The name of the candidate
   * @returns The created session result with sessionId, createdAt, and ttl, or null if parent JD not found
   * @throws Error if repository operations fail
   */
  async createSession(jdId: string, candidateName: string): Promise<Session | null> {
    logger.info({ jdId, candidateName }, '[SessionService.createSession] > createSession');

    try {
      // Fetch parent JD to validate existence and get TTL
      logger.debug({ jdId }, '[SessionService.createSession] - Fetching parent job description');
      const parentJd = await jobDescriptionRepository.getById(jdId);

      if (!parentJd) {
        logger.warn({ jdId }, '[SessionService.createSession] - Parent job description not found');
        logger.info('[SessionService.createSession] < createSession - parent not found');
        return null;
      }

      logger.debug({ jdId, ttl: parentJd.TTL }, '[SessionService.createSession] - Parent job description found');

      // Create new session with copied TTL
      const sessionId = randomUUID();
      const now = new Date().toISOString();

      const item: SessionItem = {
        PK: `JD#${jdId}`,
        SK: `SESSION#${sessionId}`,
        sessionId,
        jdId,
        candidateName,
        status: 'PLAN_PENDING',
        createdAt: now,
        TTL: parentJd.TTL,
      };

      logger.debug({ sessionId, jdId }, '[SessionService.createSession] - Persisting session');
      await sessionRepository.put(item);
      logger.debug({ sessionId, jdId, candidateName }, '[SessionService.createSession] - Session created');

      logger.info({ sessionId, jdId }, '[SessionService.createSession] < createSession');
      return sessionRepository.toSession(item);
    } catch (error) {
      logger.error({ error, jdId, candidateName }, '[SessionService.createSession] - Failed to create session');
      throw error;
    }
  }
}

/**
 * Singleton instance of SessionService
 */
export const sessionService = new SessionService();

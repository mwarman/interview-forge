import { randomUUID } from 'crypto';

import { Session, ApprovePlanRequest } from '@interview-forge/shared';

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
        GSI1PK: `JD#${jdId}`,
        GSI1SK: `SESSION#${now}#${sessionId}`,
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

  /**
   * List all sessions for a given JD ID, sorted by createdAt ascending
   * @param jdId - The unique identifier of the parent job description
   * @returns Array of sessions sorted by createdAt ascending
   * @throws Error if repository query fails
   */
  async listByJdId(jdId: string): Promise<Session[]> {
    logger.info({ jdId }, '[SessionService.listByJdId] > listByJdId');

    try {
      const sessions = await sessionRepository.queryByJdId(jdId);
      logger.info({ jdId, count: sessions.length }, '[SessionService.listByJdId] - Retrieved all sessions for JD');
      logger.info('[SessionService.listByJdId] < listByJdId');
      return sessions;
    } catch (error) {
      logger.error({ error, jdId }, '[SessionService.listByJdId] - Failed to list sessions for JD');
      throw error;
    }
  }

  /**
   * Fetch a single session by its ID and parent JD ID
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The session if found, null if not found
   * @throws Error if repository get fails
   */
  async getById(jdId: string, sessionId: string): Promise<Session | null> {
    logger.info({ jdId, sessionId }, '[SessionService.getById] > getById');

    try {
      const session = await sessionRepository.getById(jdId, sessionId);
      logger.info({ jdId, sessionId }, '[SessionService.getById] < getById');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionService.getById] - Failed to get session');
      throw error;
    }
  }

  /**
   * Update a session with arbitrary updates
   * Supports flexible updates to any session field(s) (e.g., plan, status, scorecard, assessment)
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param updates - Object with field names and values to update
   * @returns The updated session
   * @throws Error if repository update fails or session not found
   */
  async updateSession(jdId: string, sessionId: string, updates: Record<string, unknown>): Promise<Session> {
    logger.info({ jdId, sessionId, updates }, '[SessionService.updateSession] > updateSession');

    try {
      const session = await sessionRepository.updateById(jdId, sessionId, updates);
      logger.info({ jdId, sessionId }, '[SessionService.updateSession] < updateSession');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionService.updateSession] - Failed to update session');
      throw error;
    }
  }

  /**
   * Approve a session's interview plan
   * Accepts an optional modified plan and updates the session status to PLAN_APPROVED
   * Uses a condition expression to ensure idempotency (prevents updating if already approved)
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param request - The approve plan request (may contain optional modified plan)
   * @returns The updated session with status set to PLAN_APPROVED
   * @throws Error if repository update fails, session not found, or status is already beyond PLAN_PENDING
   */
  async approvePlan(jdId: string, sessionId: string, request: ApprovePlanRequest): Promise<Session> {
    logger.info({ jdId, sessionId, hasPlan: !!request.plan }, '[SessionService.approvePlan] > approvePlan');

    try {
      if (request.plan) {
        logger.debug({ jdId, sessionId }, '[SessionService.approvePlan] - Updating with modified plan');
      } else {
        logger.debug(
          { jdId, sessionId },
          '[SessionService.approvePlan] - Approving existing plan without modification',
        );
      }

      // Delegate to repository with optional modified plan
      const session = await sessionRepository.updateWithApprovedPlan(jdId, sessionId, request.plan);

      logger.info({ jdId, sessionId }, '[SessionService.approvePlan] < approvePlan');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionService.approvePlan] - Failed to approve plan');
      throw error;
    }
  }
}

/**
 * Singleton instance of SessionService
 */
export const sessionService = new SessionService();

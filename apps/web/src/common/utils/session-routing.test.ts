import { describe, it, expect } from 'vitest';

import { getSessionRoute } from './session-routing';

describe('getSessionRoute', () => {
  const jdId = 'jd-123';
  const sessionId = 'session-456';

  describe('plan page routes', () => {
    it('should return plan route for PLAN_PENDING status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'PLAN_PENDING')).toBe('/jds/jd-123/sessions/session-456/plan');
    });

    it('should return plan route for PLAN_GENERATING status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'PLAN_GENERATING')).toBe('/jds/jd-123/sessions/session-456/plan');
    });

    it('should return plan route for PLAN_ERROR status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'PLAN_ERROR')).toBe('/jds/jd-123/sessions/session-456/plan');
    });

    it('should return plan route for PLAN_GENERATED status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'PLAN_GENERATED')).toBe('/jds/jd-123/sessions/session-456/plan');
    });
  });

  describe('scorecard page routes', () => {
    it('should return scorecard route for PLAN_APPROVED status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'PLAN_APPROVED')).toBe('/jds/jd-123/sessions/session-456/scorecard');
    });
  });

  describe('assessment page routes', () => {
    it('should return assessment route for SCORED status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'SCORED')).toBe('/jds/jd-123/sessions/session-456/assessment');
    });

    it('should return assessment route for ASSESS_GENERATING status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'ASSESS_GENERATING')).toBe('/jds/jd-123/sessions/session-456/assessment');
    });

    it('should return assessment route for ASSESS_ERROR status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'ASSESS_ERROR')).toBe('/jds/jd-123/sessions/session-456/assessment');
    });

    it('should return assessment route for ASSESSED status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'ASSESSED')).toBe('/jds/jd-123/sessions/session-456/assessment');
    });

    it('should return assessment route for COMPLETE status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'COMPLETE')).toBe('/jds/jd-123/sessions/session-456/assessment');
    });
  });

  describe('default routes', () => {
    it('should return detail route for unknown status', () => {
      // Arrange, Act & Assert
      expect(getSessionRoute(jdId, sessionId, 'UNKNOWN_STATUS')).toBe('/jds/jd-123/sessions/session-456/detail');
    });
  });
});

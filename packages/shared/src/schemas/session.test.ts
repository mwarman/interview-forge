import { describe, it, expect } from 'vitest';
import {
  SessionSchema,
  SessionStatusSchema,
  ApproveAssessmentRequestSchema,
  type Session,
  type SessionStatus,
  type ApproveAssessmentRequest,
} from './session';

describe('SessionStatusSchema', () => {
  describe('valid enum values', () => {
    it('should accept PLAN_GENERATING', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('PLAN_GENERATING');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept PLAN_ERROR', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('PLAN_ERROR');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept PLAN_PENDING', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('PLAN_PENDING');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept PLAN_GENERATED', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('PLAN_GENERATED');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept PLAN_APPROVED', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('PLAN_APPROVED');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept SCORED', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('SCORED');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept ASSESS_GENERATING', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('ASSESS_GENERATING');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept ASSESS_ERROR', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('ASSESS_ERROR');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept ASSESSED', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('ASSESSED');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept COMPLETE', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('COMPLETE');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid enum values', () => {
    it('should reject invalid status value', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('INVALID_STATUS');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject lowercase status value', () => {
      // Arrange & Act
      const result = SessionStatusSchema.safeParse('plan_pending');

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('SessionSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete session with all required fields and no optionals', () => {
      // Arrange
      const validSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING' as SessionStatus,
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(validSession);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSession);
        expect(result.data.plan).toBeUndefined();
        expect(result.data.scorecard).toBeUndefined();
        expect(result.data.assessment).toBeUndefined();
      }
    });

    it('should validate a session with plan Map', () => {
      // Arrange
      const validSession: Session = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_APPROVED',
        plan: { competencies: ['Leadership', 'Technical'], questions: [] },
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(validSession);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBeDefined();
        expect(result.data.scorecard).toBeUndefined();
      }
    });

    it('should validate a session with scorecard Map', () => {
      // Arrange
      const validSession: Session = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'SCORED',
        scorecard: { ratings: [4, 5, 3], notes: 'Excellent communication' },
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(validSession);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scorecard).toBeDefined();
      }
    });

    it('should validate a session with assessment Map', () => {
      // Arrange
      const validSession: Session = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'COMPLETE',
        assessment: { recommendation: 'HIRE', reasoning: 'Strong fit' },
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(validSession);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assessment).toBeDefined();
      }
    });

    it('should validate a session with all optional Maps populated', () => {
      // Arrange
      const validSession: Session = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'COMPLETE',
        plan: { competencies: ['Leadership'], questions: [] },
        scorecard: { ratings: [4], notes: 'Good' },
        assessment: { recommendation: 'HIRE', reasoning: 'Strong' },
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(validSession);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBeDefined();
        expect(result.data.scorecard).toBeDefined();
        expect(result.data.assessment).toBeDefined();
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject a session missing sessionId', () => {
      // Arrange
      const invalidSession = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session missing jdId', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session with empty candidateName', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: '',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session missing status', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session missing createdAt', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session missing TTL', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid field values', () => {
    it('should reject a session with invalid UUID for sessionId', () => {
      // Arrange
      const invalidSession = {
        sessionId: 'not-a-uuid',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session with invalid UUID for jdId', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: 'not-a-uuid',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session with invalid status enum value', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'INVALID_STATUS',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session with invalid ISO 8601 datetime for createdAt', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: 'not-a-datetime',
        TTL: 1719014400,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a session with non-positive TTL', () => {
      // Arrange
      const invalidSession = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 0,
      };

      // Act
      const result = SessionSchema.safeParse(invalidSession);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer Session and SessionStatus types', () => {
      // Arrange & Act
      const status: SessionStatus = 'PLAN_PENDING';
      const session: Session = {
        sessionId: '223e4567-e89b-12d3-a456-426614174000',
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        candidateName: 'Jane Doe',
        status,
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Assert
      expect(session).toBeDefined();
      expect(session.sessionId).toBeTruthy();
      expect(status).toBe('PLAN_PENDING');
    });
  });
});

describe('ApproveAssessmentRequestSchema', () => {
  describe('valid payloads', () => {
    it('should accept empty object (approve as-is)', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({});

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept override recommendation only', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({
        overrideRecommendation: 'STRONG_HIRE',
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept override reasoning only', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({
        overrideReasoning: 'Candidate showed exceptional communication skills in follow-up.',
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept both override recommendation and reasoning', () => {
      // Arrange
      const request: ApproveAssessmentRequest = {
        overrideRecommendation: 'STRONG_HIRE',
        overrideReasoning: 'After discussion with team, candidate exceeds all requirements.',
      };

      // Act
      const result = ApproveAssessmentRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept all valid recommendation values', () => {
      // Arrange
      const recommendations = ['HIRE', 'NO_HIRE', 'STRONG_HIRE', 'STRONG_NO_HIRE'] as const;

      recommendations.forEach((recommendation) => {
        // Act
        const result = ApproveAssessmentRequestSchema.safeParse({
          overrideRecommendation: recommendation,
          overrideReasoning: 'Test reasoning',
        });

        // Assert
        expect(result.success).toBe(true);
      });
    });
  });

  describe('invalid payloads', () => {
    it('should reject invalid override recommendation', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({
        overrideRecommendation: 'INVALID_RECOMMENDATION',
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject non-string override reasoning', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({
        overrideReasoning: 123,
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject non-string override recommendation', () => {
      // Arrange & Act
      const result = ApproveAssessmentRequestSchema.safeParse({
        overrideRecommendation: { value: 'HIRE' },
      });

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { JobDescriptionSchema, SessionSchema, SessionStatusSchema, type SessionStatus } from './index';

describe('Shared Package Exports', () => {
  it('should export JobDescriptionSchema', () => {
    // Arrange & Act & Assert
    expect(JobDescriptionSchema).toBeDefined();
    expect(typeof JobDescriptionSchema.parse).toBe('function');
  });

  it('should export SessionSchema', () => {
    // Arrange & Act & Assert
    expect(SessionSchema).toBeDefined();
    expect(typeof SessionSchema.parse).toBe('function');
  });

  it('should export SessionStatusSchema', () => {
    // Arrange & Act & Assert
    expect(SessionStatusSchema).toBeDefined();
    expect(typeof SessionStatusSchema.parse).toBe('function');
  });

  it('should successfully parse JobDescription via exported schema', () => {
    // Arrange
    const testJD = {
      jdId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Job',
      rawText: 'Test description',
      createdAt: '2026-06-03T11:00:00Z',
      TTL: 1719014400,
    };

    // Act
    const result = JobDescriptionSchema.safeParse(testJD);

    // Assert
    expect(result.success).toBe(true);
  });

  it('should successfully parse Session via exported schema', () => {
    // Arrange
    const testSession = {
      sessionId: '223e4567-e89b-12d3-a456-426614174000',
      jdId: '123e4567-e89b-12d3-a456-426614174000',
      candidateName: 'Test Candidate',
      status: 'PLAN_PENDING' as SessionStatus,
      createdAt: '2026-06-03T11:00:00Z',
      TTL: 1719014400,
    };

    // Act
    const result = SessionSchema.safeParse(testSession);

    // Assert
    expect(result.success).toBe(true);
  });

  it('should validate SessionStatus enum values', () => {
    // Arrange
    const validStatuses = ['PLAN_PENDING', 'PLAN_APPROVED', 'SCORED', 'ASSESSED', 'COMPLETE'];

    // Act & Assert
    validStatuses.forEach((status) => {
      const result = SessionStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });
});

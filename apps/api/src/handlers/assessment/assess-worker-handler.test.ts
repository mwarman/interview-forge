import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies BEFORE importing the handler
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/assess-service', () => ({
  assessService: {
    generateAssessment: vi.fn(),
  },
}));

vi.mock('@/repositories/session-repository', () => ({
  sessionRepository: {
    updateById: vi.fn(),
  },
}));

import { handle } from './assess-worker-handler';
import { assessService } from '@/services/assess-service';
import { sessionRepository } from '@/repositories/session-repository';

/**
 * Helper to create a valid assess-worker event
 */
const createValidEvent = (jdId: string, sessionId: string) => ({
  jdId,
  sessionId,
});

describe('assess-worker-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('event validation', () => {
    it('should handle event with missing jdId gracefully (validation error caught)', async () => {
      // Arrange
      const invalidEvent = { sessionId: '660e8400-e29b-41d4-a716-446655440001' };

      // Act
      await handle(invalidEvent);

      // Assert - handler catches validation errors and does not call generateAssessment
      expect(assessService.generateAssessment).not.toHaveBeenCalled();
      // No DynamoDB update since we cannot extract jdId/sessionId from invalid event
      expect(sessionRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle event with missing sessionId gracefully (validation error caught)', async () => {
      // Arrange
      const invalidEvent = { jdId: '550e8400-e29b-41d4-a716-446655440000' };

      // Act
      await handle(invalidEvent);

      // Assert - handler catches validation errors and does not call generateAssessment
      expect(assessService.generateAssessment).not.toHaveBeenCalled();
      expect(sessionRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle event with invalid jdId UUID gracefully (validation error caught, session marked with error)', async () => {
      // Arrange
      const invalidEvent = { jdId: 'not-a-uuid', sessionId: '660e8400-e29b-41d4-a716-446655440001' };

      vi.mocked(sessionRepository.updateById).mockResolvedValue({
        sessionId: '660e8400-e29b-41d4-a716-446655440001',
        jdId: 'not-a-uuid',
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(invalidEvent);

      // Assert - handler catches validation errors, extracts IDs from event, and updates session
      expect(assessService.generateAssessment).not.toHaveBeenCalled();
      // The handler attempts to mark the session with error even if validation fails
      expect(sessionRepository.updateById).toHaveBeenCalledWith(
        'not-a-uuid',
        '660e8400-e29b-41d4-a716-446655440001',
        expect.objectContaining({
          status: 'ASSESS_ERROR',
        }),
      );
    });

    it('should handle event with invalid sessionId UUID gracefully (validation error caught, session marked with error)', async () => {
      // Arrange
      const invalidEvent = { jdId: '550e8400-e29b-41d4-a716-446655440000', sessionId: 'not-a-uuid' };

      vi.mocked(sessionRepository.updateById).mockResolvedValue({
        sessionId: 'not-a-uuid',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(invalidEvent);

      // Assert
      expect(assessService.generateAssessment).not.toHaveBeenCalled();
      expect(sessionRepository.updateById).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'not-a-uuid',
        expect.objectContaining({
          status: 'ASSESS_ERROR',
        }),
      );
    });

    it('should accept valid event with valid UUIDs', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      vi.mocked(assessService.generateAssessment).mockResolvedValue({
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESSED',
        assessment: { assessmentId: 'a1', recommendation: 'HIRE' },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(validEvent);

      // Assert
      expect(assessService.generateAssessment).toHaveBeenCalledWith(jdId, sessionId);
    });
  });

  describe('successful assessment generation', () => {
    it('should successfully invoke generateAssessment and log completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      const mockUpdatedSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESSED',
        assessment: { assessmentId: 'a1', recommendation: 'HIRE' },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      vi.mocked(assessService.generateAssessment).mockResolvedValue(mockUpdatedSession);

      // Act
      await handle(validEvent);

      // Assert
      expect(assessService.generateAssessment).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle write-assessment-action completion without additional DynamoDB writes', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      vi.mocked(assessService.generateAssessment).mockResolvedValue({
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESSED',
        assessment: { assessmentId: 'a1', recommendation: 'HIRE' },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(validEvent);

      // Assert
      // On success, only generateAssessment is called, no error handling updates
      expect(assessService.generateAssessment).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch Bedrock Agent invocation errors and write ASSESS_ERROR status', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      const agentError = new Error('Bedrock Agent service unavailable');
      vi.mocked(assessService.generateAssessment).mockRejectedValue(agentError);

      vi.mocked(sessionRepository.updateById).mockResolvedValue({
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Bedrock Agent service unavailable',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(validEvent);

      // Assert
      expect(assessService.generateAssessment).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Bedrock Agent service unavailable',
      });
    });

    it('should absorb DynamoDB update errors when writing ASSESS_ERROR status', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      const agentError = new Error('Assessment generation failed');
      vi.mocked(assessService.generateAssessment).mockRejectedValue(agentError);

      const updateError = new Error('DynamoDB write failed');
      vi.mocked(sessionRepository.updateById).mockRejectedValue(updateError);

      // Act & Assert - should not throw, errors are absorbed
      await expect(handle(validEvent)).resolves.toBeUndefined();

      // The attempt to write error status should still have been made
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Assessment generation failed',
      });
    });

    it('should use error message from Error object when available', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      const specificError = new Error('Session not found after agent invocation');
      vi.mocked(assessService.generateAssessment).mockRejectedValue(specificError);

      vi.mocked(sessionRepository.updateById).mockResolvedValue({
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Session not found after agent invocation',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(validEvent);

      // Assert
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Session not found after agent invocation',
      });
    });

    it('should handle non-Error exception objects gracefully (logs error but cannot update session)', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = createValidEvent(jdId, sessionId);

      // Throw a non-Error object
      vi.mocked(assessService.generateAssessment).mockRejectedValue('Unknown error string');

      // Act
      await handle(validEvent);

      // Assert - handler catches the error and attempts to update session
      // For non-Error exceptions in this case, we still have jdId/sessionId from the event
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Unknown error',
      });
    });
  });

  describe('event payload structure', () => {
    it('should extract jdId and sessionId from valid event object', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const validEvent = {
        jdId,
        sessionId,
        extraField: 'should be ignored', // Extra fields are OK
      };

      vi.mocked(assessService.generateAssessment).mockResolvedValue({
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESSED',
        assessment: { assessmentId: 'a1', recommendation: 'HIRE' },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      });

      // Act
      await handle(validEvent);

      // Assert
      expect(assessService.generateAssessment).toHaveBeenCalledWith(jdId, sessionId);
    });
  });
});

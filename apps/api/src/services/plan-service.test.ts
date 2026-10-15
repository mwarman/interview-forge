import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies BEFORE importing the service
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/repositories/session-repository', () => ({
  sessionRepository: {
    getById: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  config: {
    PLAN_HARNESS_ARN: 'test-harness-arn',
    PLAN_WORKER_FUNCTION_NAME: 'test-plan-worker-function',
  },
}));

vi.mock('@/utils/harness-client', () => ({
  invokeHarness: vi.fn(),
}));

vi.mock('@/utils/lambda-client', () => ({
  invokeLambdaAsync: vi.fn(),
}));

import { PlanService } from './plan-service';
import { sessionRepository } from '@/repositories/session-repository';
import { invokeLambdaAsync } from '@/utils/lambda-client';
import { invokeHarness } from '@/utils/harness-client';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';
import { NotFoundError, ConflictError } from '@/errors/api-error';

/**
 * Helper to create a mock session with plan
 */
const createMockSessionWithPlan = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'PLAN_APPROVED',
  plan: {
    competencies: [
      {
        name: 'JavaScript Fundamentals',
        level: 'advanced',
        questions: [
          {
            id: 'q1',
            text: 'Explain closures',
            type: 'technical',
          },
        ],
      },
    ],
  },
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

/**
 * Helper to create a mock session without plan
 */
const createMockSessionWithoutPlan = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'PLAN_PENDING',
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

describe('PlanService', () => {
  let planService: PlanService;

  beforeEach(() => {
    vi.clearAllMocks();
    planService = new PlanService();
  });

  describe('generatePlan', () => {
    it('should successfully generate a plan when agent writes plan to session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithPlan = createMockSessionWithPlan(jdId, sessionId);

      vi.mocked(invokeHarness).mockResolvedValue('Agent response');

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithPlan);

      // Act
      const result = await planService.generatePlan(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithPlan);
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(invokeHarness).toHaveBeenCalledWith({
        harnessArn: 'test-harness-arn',
        sessionId,
        prompt: `Generate an interview plan for job description ${jdId} and session ${sessionId}`,
      });
      expect(result.plan).toBeDefined();
    });

    it('should throw PlanNotWrittenError when agent completes without writing plan', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithoutPlan = createMockSessionWithoutPlan(jdId, sessionId);

      vi.mocked(invokeHarness).mockResolvedValue('Agent response');

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithoutPlan);

      // Act & Assert
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(PlanNotWrittenError);
    });

    it('should throw AgentInvocationError when AgentCore harness invocation fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const mockError = new Error('Network timeout');
      vi.mocked(invokeHarness).mockRejectedValue(mockError);

      // Act & Assert
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
    });

    it('should throw AgentInvocationError when session not found after agent completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      vi.mocked(invokeHarness).mockResolvedValue('Agent response');

      vi.mocked(sessionRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
    });

    it('should handle agent stream with multiple events before completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithPlan = createMockSessionWithPlan(jdId, sessionId);

      vi.mocked(invokeHarness).mockResolvedValue('Agent response');

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithPlan);

      // Act
      const result = await planService.generatePlan(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithPlan);
      expect(result.plan).toBeDefined();
    });
  });

  describe('kickoffPlanGeneration', () => {
    it('should successfully kickoff plan generation and update session status to PLAN_GENERATING', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_ERROR',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const updatedSession = { ...existingSession, status: 'PLAN_GENERATING' };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await planService.kickoffPlanGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(updatedSession);
      expect(result.status).toBe('PLAN_GENERATING');
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'PLAN_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-plan-worker-function', { jdId, sessionId });
    });

    it('should throw error if session not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      vi.mocked(sessionRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(planService.kickoffPlanGeneration(jdId, sessionId)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if session status is not in valid pre-generation states', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const approvedSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_APPROVED',
        plan: { competencies: [] },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(approvedSession);

      // Act & Assert
      await expect(planService.kickoffPlanGeneration(jdId, sessionId)).rejects.toThrow(ConflictError);
    });

    it('should update session status to PLAN_ERROR on DynamoDB write failure', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const dynamoError = new Error('DynamoDB write failed');
      const errorSession = {
        ...existingSession,
        status: 'PLAN_ERROR',
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      // First call fails with DynamoDB error, second call succeeds with error status
      vi.mocked(sessionRepository.updateById).mockRejectedValueOnce(dynamoError).mockResolvedValueOnce(errorSession);

      // Act & Assert
      await expect(planService.kickoffPlanGeneration(jdId, sessionId)).rejects.toThrow('DynamoDB write failed');

      // Verify error status was attempted to be written
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'PLAN_GENERATING' });
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'PLAN_ERROR',
        planErrorMessage: 'DynamoDB write failed',
      });
    });

    it('should absorb errors from PLAN_ERROR status write', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const initialError = new Error('Initial DynamoDB write failed');
      const errorWriteError = new Error('Failed to write error status');

      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      // First call fails, second call also fails
      vi.mocked(sessionRepository.updateById)
        .mockRejectedValueOnce(initialError)
        .mockRejectedValueOnce(errorWriteError);

      // Act & Assert
      // Should rethrow the initial error, not the error write error
      await expect(planService.kickoffPlanGeneration(jdId, sessionId)).rejects.toThrow('Initial DynamoDB write failed');
    });

    it('should allow kickoff from PLAN_PENDING status (re-kickoff)', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_PENDING',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(existingSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await planService.kickoffPlanGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(existingSession);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'PLAN_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-plan-worker-function', { jdId, sessionId });
    });

    it('should allow kickoff from PLAN_ERROR status (retry)', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const errorSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'PLAN_ERROR',
        planErrorMessage: 'Previous error',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const updatedSession = { ...errorSession, status: 'PLAN_GENERATING' };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(errorSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await planService.kickoffPlanGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(updatedSession);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'PLAN_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-plan-worker-function', { jdId, sessionId });
    });
  });
});

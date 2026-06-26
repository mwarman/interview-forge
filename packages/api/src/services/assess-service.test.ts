import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';

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
    ASSESS_AGENT_ALIAS_ID: 'test-agent-alias-id',
    ASSESS_WORKER_FUNCTION_NAME: 'test-assess-worker-function',
  },
}));

vi.mock('@aws-sdk/client-bedrock-agent-runtime');

vi.mock('@/utils/lambda-client', () => ({
  invokeLambdaAsync: vi.fn(),
}));

import { AssessService } from './assess-service';
import { sessionRepository } from '@/repositories/session-repository';
import { invokeLambdaAsync } from '@/utils/lambda-client';
import { AssessmentNotWrittenError } from '@/errors/assessment-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';
import { NotFoundError, ConflictError } from '@/errors/api-error';

/**
 * Helper to create a mock session with assessment
 */
const createMockSessionWithAssessment = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'ASSESSED',
  assessment: {
    assessmentId: 'a1',
    recommendation: 'HIRE',
    confidence: 0.95,
    reasoning: 'Candidate is qualified',
    competencyAssessments: [
      {
        competency: 'JavaScript',
        level: 'advanced',
        notes: 'Strong fundamentals',
      },
    ],
  },
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

/**
 * Helper to create a mock session without assessment
 */
const createMockSessionWithoutAssessment = (jdId: string, sessionId: string) => ({
  sessionId,
  jdId,
  candidateName: 'Test Candidate',
  status: 'SCORED',
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1234567890,
});

describe('AssessService', () => {
  let assessService: AssessService;

  beforeEach(() => {
    vi.clearAllMocks();
    assessService = new AssessService();
  });

  describe('generateAssessment', () => {
    it('should successfully generate an assessment when agent writes assessment to session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithAssessment = createMockSessionWithAssessment(jdId, sessionId);

      // Mock the Bedrock Agent response stream with chunk data
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Assessment processing...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Assessment generated'),
          },
        };
        // Stream ends when generator completes (no explicit completion event needed)
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithAssessment);

      // Act
      const result = await assessService.generateAssessment(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithAssessment);
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(result.assessment).toBeDefined();
    });

    it('should throw AssessmentNotWrittenError when agent completes without writing assessment', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithoutAssessment = createMockSessionWithoutAssessment(jdId, sessionId);

      // Mock the Bedrock Agent response stream that completes without writing assessment
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Processing...'),
          },
        };
        // Stream ends without agent writing assessment to DynamoDB
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithoutAssessment);

      // Act & Assert
      await expect(assessService.generateAssessment(jdId, sessionId)).rejects.toThrow(AssessmentNotWrittenError);
    });

    it('should throw AgentInvocationError when Bedrock Agent invocation fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const mockError = new Error('Network timeout');
      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockRejectedValue(mockError);

      // Act & Assert
      await expect(assessService.generateAssessment(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
    });

    it('should throw AgentInvocationError when session not found after agent completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      // Mock the Bedrock Agent response stream
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Processing...'),
          },
        };
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(assessService.generateAssessment(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
    });

    it('should handle agent stream with multiple events before completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithAssessment = createMockSessionWithAssessment(jdId, sessionId);

      // Mock the Bedrock Agent response stream with multiple chunk events
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Starting analysis...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Evaluating responses...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Assessment complete'),
          },
        };
        // Stream ends when generator completes
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithAssessment);

      // Act
      const result = await assessService.generateAssessment(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithAssessment);
      expect(result.assessment).toBeDefined();
    });
  });

  describe('kickoffAssessmentGeneration', () => {
    it('should successfully kickoff assessment generation and update session status to ASSESS_GENERATING', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const updatedSession = { ...existingSession, status: 'ASSESS_GENERATING' };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await assessService.kickoffAssessmentGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(updatedSession);
      expect(result.status).toBe('ASSESS_GENERATING');
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'ASSESS_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-assess-worker-function', { jdId, sessionId });
    });

    it('should throw error if session not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      vi.mocked(sessionRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(assessService.kickoffAssessmentGeneration(jdId, sessionId)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if session status is not in valid pre-generation states', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const approvedSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESSED',
        assessment: { assessmentId: 'a1', recommendation: 'HIRE' },
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(approvedSession);

      // Act & Assert
      await expect(assessService.kickoffAssessmentGeneration(jdId, sessionId)).rejects.toThrow(ConflictError);
    });

    it('should update session status to ASSESS_ERROR on DynamoDB write failure', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'SCORED',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const dynamoError = new Error('DynamoDB write failed');
      const errorSession = {
        ...existingSession,
        status: 'ASSESS_ERROR',
      };

      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      // First call fails with DynamoDB error, second call succeeds with error status
      vi.mocked(sessionRepository.updateById).mockRejectedValueOnce(dynamoError).mockResolvedValueOnce(errorSession);

      // Act & Assert
      await expect(assessService.kickoffAssessmentGeneration(jdId, sessionId)).rejects.toThrow('DynamoDB write failed');

      // Verify error status was attempted to be written
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'ASSESS_GENERATING' });
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, {
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'DynamoDB write failed',
      });
    });

    it('should absorb errors from ASSESS_ERROR status write', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'SCORED',
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
      await expect(assessService.kickoffAssessmentGeneration(jdId, sessionId)).rejects.toThrow(
        'Initial DynamoDB write failed',
      );
    });

    it('should allow kickoff from SCORED status (first assessment)', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const existingSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'SCORED',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(existingSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(existingSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await assessService.kickoffAssessmentGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(existingSession);
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'ASSESS_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-assess-worker-function', { jdId, sessionId });
    });

    it('should allow kickoff from ASSESS_ERROR status (retry)', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const errorSession = {
        sessionId,
        jdId,
        candidateName: 'Test Candidate',
        status: 'ASSESS_ERROR',
        assessErrorMessage: 'Previous error',
        createdAt: '2026-06-07T00:00:00Z',
        TTL: 1234567890,
      };

      const updatedSession = { ...errorSession, status: 'ASSESS_GENERATING' };

      vi.clearAllMocks();
      vi.mocked(sessionRepository.getById).mockResolvedValue(errorSession);
      vi.mocked(sessionRepository.updateById).mockResolvedValue(updatedSession);
      vi.mocked(invokeLambdaAsync).mockResolvedValue({});

      // Act
      const result = await assessService.kickoffAssessmentGeneration(jdId, sessionId);

      // Assert
      expect(result).toEqual(updatedSession);
      expect(result.status).toBe('ASSESS_GENERATING');
      expect(sessionRepository.updateById).toHaveBeenCalledWith(jdId, sessionId, { status: 'ASSESS_GENERATING' });
      expect(invokeLambdaAsync).toHaveBeenCalledWith('test-assess-worker-function', { jdId, sessionId });
    });
  });
});

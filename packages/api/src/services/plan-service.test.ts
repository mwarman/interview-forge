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
  },
}));

vi.mock('@/utils/config', () => ({
  config: {
    PLAN_AGENT_ALIAS_ID: 'test-agent-alias-id',
  },
}));

vi.mock('@aws-sdk/client-bedrock-agent-runtime');

import { PlanService } from './plan-service';
import { sessionRepository } from '@/repositories/session-repository';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';

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

      // Mock the Bedrock Agent response stream with chunk data
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Agent processing...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Plan generated'),
          },
        };
        // Stream ends when generator completes (no explicit completion event needed)
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithPlan);

      // Act
      const result = await planService.generatePlan(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithPlan);
      expect(sessionRepository.getById).toHaveBeenCalledWith(jdId, sessionId);
      expect(result.plan).toBeDefined();
    });

    it('should throw PlanNotWrittenError when agent completes without writing plan', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithoutPlan = createMockSessionWithoutPlan(jdId, sessionId);

      // Mock the Bedrock Agent response stream that completes without writing plan
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Processing...'),
          },
        };
        // Stream ends without agent writing plan to DynamoDB
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithoutPlan);

      // Act & Assert
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(PlanNotWrittenError);
    });

    it('should throw AgentInvocationError when Bedrock Agent invocation fails', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';

      const mockError = new Error('Network timeout');
      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockRejectedValue(mockError);

      // Act & Assert
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
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
      await expect(planService.generatePlan(jdId, sessionId)).rejects.toThrow(AgentInvocationError);
    });

    it('should handle agent stream with multiple events before completion', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660e8400-e29b-41d4-a716-446655440001';
      const mockSessionWithPlan = createMockSessionWithPlan(jdId, sessionId);

      // Mock the Bedrock Agent response stream with multiple chunk events
      const mockOutputStream = (async function* () {
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Starting analysis...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Generating questions...'),
          },
        };
        yield {
          chunk: {
            bytes: new TextEncoder().encode('Plan complete'),
          },
        };
        // Stream ends when generator completes
      })();

      vi.mocked(BedrockAgentRuntimeClient.prototype.send).mockResolvedValue({
        completion: mockOutputStream,
      });

      vi.mocked(sessionRepository.getById).mockResolvedValue(mockSessionWithPlan);

      // Act
      const result = await planService.generatePlan(jdId, sessionId);

      // Assert
      expect(result).toEqual(mockSessionWithPlan);
      expect(result.plan).toBeDefined();
    });
  });
});

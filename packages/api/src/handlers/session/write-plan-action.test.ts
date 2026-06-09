import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BedrockActionEvent, BedrockActionResponse, InterviewPlan, Session } from '@interview-forge/shared';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/session-service', () => ({
  sessionService: {
    updateSession: vi.fn(),
  },
}));

import { handle } from './write-plan-action';
import { sessionService } from '../../services/session-service';

describe('write-plan-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock Bedrock action event with plan
   */
  const createMockEvent = (sessionId: string, jdId: string, plan: InterviewPlan): BedrockActionEvent => ({
    actionGroup: 'interview-forge-write-plan',
    function: 'write-plan-action',
    parameters: [
      {
        name: 'sessionId',
        value: sessionId,
      },
      {
        name: 'jdId',
        value: jdId,
      },
      {
        name: 'plan',
        value: JSON.stringify(plan),
      },
    ],
  });

  /**
   * Helper to create a valid InterviewPlan
   */
  const createValidPlan = (): InterviewPlan => ({
    planId: '880c6633-351e-43d7-8949-779988773333',
    competencies: [
      {
        competencyId: '990d7744-462f-54e8-9a50-880099884444',
        name: 'Leadership',
        description: 'Ability to lead teams',
        evaluationCriteria: 'Demonstrates clear vision and direction',
        questions: [
          {
            questionId: 'aa1e8855-573d-65f9-ab61-991100995555',
            text: 'Tell me about a time you led a team',
            type: 'BEHAVIORAL',
            followUpPrompt: 'What was the outcome?',
          },
        ],
      },
    ],
    generatedAt: '2026-06-03T12:00:00.000Z',
  });

  describe('happy path', () => {
    it('should successfully write a plan and update session', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event = createMockEvent(sessionId, jdId, validPlan);

      const mockUpdatedSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        plan: validPlan,
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      } as Session;

      vi.mocked(sessionService.updateSession).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-write-plan');
      expect(result.response.function).toBe('write-plan-action');
      expect(result.response.functionResponse).toBeDefined();

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('sessionId', sessionId);
      expect(responseBody).toHaveProperty('status', 'PLAN_PENDING');
      expect(responseBody).toHaveProperty('message', 'Plan written successfully');

      expect(sessionService.updateSession).toHaveBeenCalledWith(jdId, sessionId, {
        plan: validPlan,
        status: 'PLAN_PENDING',
      });
    });
  });

  describe('error cases - invalid parameters', () => {
    it('should return error when sessionId parameter is missing', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: JSON.stringify(validPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when jdId parameter is missing', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const validPlan = createValidPlan();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'plan',
            value: JSON.stringify(validPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when plan parameter is missing', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when parameters have empty values', async () => {
      // Arrange
      const sessionId = '';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: JSON.stringify(validPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });
  });

  describe('error cases - invalid JSON', () => {
    it('should return error when plan is not valid JSON', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: 'invalid json string {',
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Invalid plan format');
      expect(responseBody.message).toContain('valid JSON string');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when plan JSON is empty object', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: '{}',
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });
  });

  describe('error cases - schema validation', () => {
    it('should return error when plan missing required fields', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidPlan = {
        planId: '880c6633-351e-43d7-8949-779988773333',
        // Missing competencies
        generatedAt: '2026-06-03T12:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: JSON.stringify(invalidPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when competencies array is empty', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidPlan = {
        planId: '880c6633-351e-43d7-8949-779988773333',
        competencies: [], // Empty competencies
        generatedAt: '2026-06-03T12:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: JSON.stringify(invalidPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
    });

    it('should return detailed validation error messages', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidPlan = {
        planId: 'not-a-valid-uuid', // Invalid UUID
        competencies: [
          {
            competencyId: '990d7744-462f-54e8-9a50-880099884444',
            name: 'Leadership',
            description: 'Leadership skills',
            evaluationCriteria: 'Clear vision',
            questions: [],
          },
        ],
        generatedAt: '2026-06-03T12:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'plan',
            value: JSON.stringify(invalidPlan),
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(responseBody.message).toBeDefined();
    });
  });

  describe('error cases - event structure', () => {
    it('should return error when event structure is invalid', async () => {
      // Arrange
      const invalidEvent = {
        actionGroup: 'interview-forge-write-plan',
        // Missing function and parameters
      };

      // Act
      const result = (await handle(invalidEvent)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Invalid event structure');
    });
  });

  describe('error cases - service failures', () => {
    it('should return error when service throws exception', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event = createMockEvent(sessionId, jdId, validPlan);

      vi.mocked(sessionService.updateSession).mockRejectedValue(new Error('DynamoDB write failed'));

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-write-plan');
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(responseBody.message).toContain('unexpected error');
    });

    it('should return error when session not found', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event = createMockEvent(sessionId, jdId, validPlan);

      vi.mocked(sessionService.updateSession).mockRejectedValue(new Error('Session not found'));

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
    });
  });

  describe('response format', () => {
    it('should always return valid Bedrock action response format', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event = createMockEvent(sessionId, jdId, validPlan);

      const mockUpdatedSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        plan: validPlan,
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      } as Session;

      vi.mocked(sessionService.updateSession).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response).toHaveProperty('actionGroup');
      expect(result.response).toHaveProperty('function');
      expect(result.response).toHaveProperty('functionResponse');
      expect(result.response.functionResponse).toHaveProperty('responseBody');
      expect(result.response.functionResponse.responseBody).toHaveProperty('TEXT');
      expect(result.response.functionResponse.responseBody.TEXT).toHaveProperty('body');

      const body = result.response.functionResponse.responseBody.TEXT.body;
      expect(typeof body).toBe('string');
      expect(() => JSON.parse(body)).not.toThrow();
    });

    it('should echo back actionGroup and function from request', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validPlan = createValidPlan();
      const event: BedrockActionEvent = {
        actionGroup: 'custom-group',
        function: 'custom-write-plan',
        parameters: [
          { name: 'sessionId', value: sessionId },
          { name: 'jdId', value: jdId },
          { name: 'plan', value: JSON.stringify(validPlan) },
        ],
      };

      const mockUpdatedSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'PLAN_PENDING',
        plan: validPlan,
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      } as Session;

      vi.mocked(sessionService.updateSession).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('custom-group');
      expect(result.response.function).toBe('custom-write-plan');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BedrockActionEvent, BedrockActionResponse, Assessment, Session } from '@interview-forge/shared';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/session-service', () => ({
  sessionService: {
    updateSession: vi.fn(),
  },
}));

import { handle } from './write-assessment-action';
import { sessionService } from '../../services/session-service';

describe('write-assessment-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock Bedrock action event with assessment
   */
  const createMockEvent = (sessionId: string, jdId: string, assessment: Assessment): BedrockActionEvent => ({
    actionGroup: 'interview-forge-write-assessment',
    function: 'write-assessment-action',
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
        name: 'assessment',
        value: JSON.stringify(assessment),
      },
    ],
  });

  /**
   * Helper to create a valid Assessment
   */
  const createValidAssessment = (): Assessment => ({
    assessmentId: '880c6633-351e-43d7-8949-779988773333',
    recommendation: 'STRONG_HIRE',
    confidence: 'HIGH',
    reasoning:
      'The candidate demonstrated exceptional leadership skills and technical depth across all competencies. Clear communication, strategic thinking, and team collaboration were evident throughout the interview. Strong cultural fit with team values and demonstrated ability to drive initiatives forward.',
    competencyAssessments: [
      {
        competencyId: '990d7744-462f-54e8-9a50-880099884444',
        name: 'Leadership',
        strengths: 'Clear vision, strong decision-making, team motivation',
        concerns: 'Limited experience with distributed teams',
        conflictsIdentified: [],
      },
    ],
    generatedAt: '2026-06-03T15:00:00.000Z',
  });

  describe('happy path', () => {
    it('should successfully write an assessment and update session', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validAssessment = createValidAssessment();
      const event = createMockEvent(sessionId, jdId, validAssessment);

      const mockUpdatedSession = {
        sessionId,
        jdId,
        candidateName: 'John Doe',
        status: 'ASSESSED',
        assessment: validAssessment,
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      } as Session;

      vi.mocked(sessionService.updateSession).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-write-assessment');
      expect(result.response.function).toBe('write-assessment-action');
      expect(result.response.functionResponse).toBeDefined();

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('sessionId', sessionId);
      expect(responseBody).toHaveProperty('status', 'ASSESSED');
      expect(responseBody).toHaveProperty('message', 'Assessment written successfully');

      expect(sessionService.updateSession).toHaveBeenCalledWith(jdId, sessionId, {
        assessment: validAssessment,
        status: 'ASSESSED',
      });
    });
  });

  describe('error cases - invalid parameters', () => {
    it('should return error when sessionId parameter is missing', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const validAssessment = createValidAssessment();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'assessment',
            value: JSON.stringify(validAssessment),
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
      const validAssessment = createValidAssessment();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
          },
          {
            name: 'assessment',
            value: JSON.stringify(validAssessment),
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

    it('should return error when assessment parameter is missing', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
      const validAssessment = createValidAssessment();
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: JSON.stringify(validAssessment),
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
    it('should return error when assessment is not valid JSON', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: 'invalid json string {',
          },
        ],
      };

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Invalid assessment format');
      expect(responseBody.message).toContain('valid JSON string');
      expect(sessionService.updateSession).not.toHaveBeenCalled();
    });

    it('should return error when assessment JSON is empty object', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
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
    it('should return error when assessment missing required fields', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidAssessment = {
        assessmentId: '880c6633-351e-43d7-8949-779988773333',
        recommendation: 'HIRE',
        // Missing confidence
        reasoning:
          'The candidate demonstrated exceptional leadership skills and technical depth across all competencies. Clear communication, strategic thinking, and team collaboration were evident throughout the interview.',
        competencyAssessments: [
          {
            competencyId: '990d7744-462f-54e8-9a50-880099884444',
            name: 'Leadership',
            strengths: 'Strong',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-03T15:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: JSON.stringify(invalidAssessment),
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

    it('should return error when reasoning is too short', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidAssessment = {
        assessmentId: '880c6633-351e-43d7-8949-779988773333',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning: 'Too short', // Less than 100 characters
        competencyAssessments: [
          {
            competencyId: '990d7744-462f-54e8-9a50-880099884444',
            name: 'Leadership',
            strengths: 'Strong',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-03T15:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: JSON.stringify(invalidAssessment),
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

    it('should return error when competencyAssessments array is empty', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidAssessment = {
        assessmentId: '880c6633-351e-43d7-8949-779988773333',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated exceptional leadership skills and technical depth across all competencies. Clear communication, strategic thinking, and team collaboration were evident throughout the interview.',
        competencyAssessments: [], // Empty array
        generatedAt: '2026-06-03T15:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: JSON.stringify(invalidAssessment),
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

    it('should return detailed validation error messages', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidAssessment = {
        assessmentId: 'not-a-valid-uuid', // Invalid UUID
        recommendation: 'INVALID_RECOMMENDATION', // Invalid enum value
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated exceptional leadership skills and technical depth across all competencies. Clear communication, strategic thinking, and team collaboration were evident throughout the interview.',
        competencyAssessments: [
          {
            competencyId: '990d7744-462f-54e8-9a50-880099884444',
            name: 'Leadership',
            strengths: 'Strong',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-03T15:00:00.000Z',
      };
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: JSON.stringify(invalidAssessment),
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
        actionGroup: 'interview-forge-write-assessment',
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
      const validAssessment = createValidAssessment();
      const event = createMockEvent(sessionId, jdId, validAssessment);

      vi.mocked(sessionService.updateSession).mockRejectedValue(new Error('DynamoDB write failed'));

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-write-assessment');
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(responseBody.message).toContain('unexpected error');
    });
  });
});

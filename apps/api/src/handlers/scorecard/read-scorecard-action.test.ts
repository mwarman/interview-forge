import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BedrockActionEvent, BedrockActionResponse, Scorecard, Session } from '@interview-forge/shared';

// Mock dependencies BEFORE importing the handler
vi.mock('../../services/session-service', () => ({
  sessionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './read-scorecard-action';
import { sessionService } from '../../services/session-service';

describe('read-scorecard-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock Bedrock action event for reading a scorecard
   */
  const createMockEvent = (jdId: string, sessionId: string): BedrockActionEvent => ({
    actionGroup: 'interview-forge-read-scorecard',
    function: 'read-scorecard-action',
    parameters: [
      {
        name: 'jdId',
        value: jdId,
      },
      {
        name: 'sessionId',
        value: sessionId,
      },
    ],
  });

  /**
   * Helper to create a valid Scorecard
   */
  const createValidScorecard = (): Scorecard => ({
    scorecardId: '770d6633-351e-43d7-8949-779988773222',
    completedAt: '2026-06-03T14:00:00.000Z',
    competencyScores: [
      {
        competencyId: '990d7744-462f-54e8-9a50-880099884444',
        overallNotes: 'Strong leadership demonstrated',
        questionRatings: [
          {
            questionId: 'aa1e8855-573d-65f9-ab61-991100995555',
            rating: 5,
            notes: 'Excellent communication',
          },
        ],
      },
    ],
  });

  /**
   * Helper to create a mock session with a scorecard
   */
  const createMockSessionWithScorecard = (jdId: string, sessionId: string): Session => ({
    sessionId,
    jdId,
    candidateName: 'Jane Smith',
    status: 'SCORED',
    scorecard: createValidScorecard(),
    createdAt: '2026-06-03T12:00:00.000Z',
    TTL: 1751590800,
  });

  describe('happy path', () => {
    it('should successfully read a scorecard from session', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const mockSession = createMockSessionWithScorecard(jdId, sessionId);

      vi.mocked(sessionService.getById).mockResolvedValue(mockSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-scorecard');
      expect(result.response.function).toBe('read-scorecard-action');
      expect(result.response.functionResponse).toBeDefined();

      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('scorecardId', mockSession.scorecard?.scorecardId);
      expect(responseBody).toHaveProperty('completedAt');
      expect(responseBody).toHaveProperty('competencyScores');

      expect(sessionService.getById).toHaveBeenCalledWith(jdId, sessionId);
    });
  });

  describe('error cases - session not found', () => {
    it('should return error when session is not found', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);

      vi.mocked(sessionService.getById).mockResolvedValue(null);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error', 'Not Found');
      expect(responseBody).toHaveProperty('message');
      expect(responseBody.message).toContain(sessionId);
    });
  });

  describe('error cases - scorecard not present', () => {
    it('should return error when session does not have a scorecard', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const mockSession: Session = {
        sessionId,
        jdId,
        candidateName: 'Jane Smith',
        status: 'PLAN_APPROVED',
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionService.getById).mockResolvedValue(mockSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error', 'Not Found');
      expect(responseBody).toHaveProperty('message');
      expect(responseBody.message).toContain('Scorecard not available');
    });

    it('should return error when session scorecard is empty object', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);
      const mockSession: Session = {
        sessionId,
        jdId,
        candidateName: 'Jane Smith',
        status: 'SCORED',
        scorecard: {}, // Empty scorecard object
        createdAt: '2026-06-03T12:00:00.000Z',
        TTL: 1751590800,
      };

      vi.mocked(sessionService.getById).mockResolvedValue(mockSession);

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody).toHaveProperty('error', 'Not Found');
      expect(responseBody).toHaveProperty('message');
    });
  });

  describe('error cases - invalid parameters', () => {
    it('should return error when jdId parameter is missing', async () => {
      // Arrange
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'sessionId',
            value: sessionId,
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

    it('should return error when sessionId parameter is missing', async () => {
      // Arrange
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
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
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
    });

    it('should return error when parameters have empty values', async () => {
      // Arrange
      const jdId = '';
      const sessionId = '';
      const event: BedrockActionEvent = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: jdId,
          },
          {
            name: 'sessionId',
            value: sessionId,
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
  });

  describe('error cases - event structure', () => {
    it('should return error when event structure is invalid', async () => {
      // Arrange
      const invalidEvent = {
        actionGroup: 'interview-forge-read-scorecard',
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
      const jdId = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = '660f9411-f30c-42e5-b827-557766551111';
      const event = createMockEvent(jdId, sessionId);

      vi.mocked(sessionService.getById).mockRejectedValue(new Error('DynamoDB query failed'));

      // Act
      const result = (await handle(event)) as BedrockActionResponse;

      // Assert
      expect(result.response.actionGroup).toBe('interview-forge-read-scorecard');
      const responseBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(responseBody.message).toContain('unexpected error');
    });
  });
});

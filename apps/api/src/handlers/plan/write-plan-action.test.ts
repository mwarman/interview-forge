import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { InterviewPlan } from '@interview-forge/shared';

vi.mock('@/services/session-service', () => ({
  sessionService: {
    updateSession: vi.fn(),
  },
}));

import { handle } from './write-plan-action';
import { sessionService } from '@/services/session-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '660f9411-f30c-42e5-b827-557766551111';

const validValue: InterviewPlan = {
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
};

describe('write-plan-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write the plan, update the session status and return a success result', async () => {
    // Arrange
    vi.mocked(sessionService.updateSession).mockResolvedValue({ sessionId, status: 'PLAN_GENERATED' } as never);

    // Act
    const result = await handle({ jdId, sessionId, plan: JSON.stringify(validValue) });

    // Assert
    expect(result).toEqual({ sessionId, status: 'PLAN_GENERATED', message: 'Plan written successfully' });
    expect(sessionService.updateSession).toHaveBeenCalledWith(jdId, sessionId, {
      plan: validValue,
      status: 'PLAN_GENERATED',
    });
  });

  it('should return an invalid format error when the plan fails schema validation', async () => {
    // Act
    const result = await handle({ jdId, sessionId, plan: JSON.stringify({ invalid: true }) });

    // Assert
    expect(result).toMatchObject({ error: 'Invalid plan format' });
    expect(JSON.stringify(result)).toContain('validation failed');
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it('should return an invalid format error when the plan is not valid JSON', async () => {
    // Act
    const result = await handle({ jdId, sessionId, plan: 'not json' });

    // Assert
    expect(result).toMatchObject({ error: 'Invalid plan format' });
    expect(JSON.stringify(result)).toContain('must be a valid JSON string');
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it.each([
    [{}],
    [{ jdId, sessionId }],
    [{ jdId, plan: '{}' }],
    [{ sessionId, plan: '{}' }],
    [{ jdId, sessionId, plan: '' }],
  ])('should return an invalid arguments error for event %j', async (event) => {
    // Act
    const result = await handle(event);

    // Assert
    expect(result).toMatchObject({ error: 'Invalid tool arguments' });
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it('should return an Internal Server Error when the service throws', async () => {
    // Arrange
    vi.mocked(sessionService.updateSession).mockRejectedValue(new Error('DynamoDB connection failed'));

    // Act
    const result = await handle({ jdId, sessionId, plan: JSON.stringify(validValue) });

    // Assert
    expect(result).toMatchObject({ error: 'Internal Server Error' });
  });
});

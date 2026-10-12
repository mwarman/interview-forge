import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { Assessment } from '@interview-forge/shared';

vi.mock('@/services/session-service', () => ({
  sessionService: {
    updateSession: vi.fn(),
  },
}));

import { handle } from './write-assessment-action';
import { sessionService } from '@/services/session-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '660f9411-f30c-42e5-b827-557766551111';

const validValue: Assessment = {
  assessmentId: '880c6633-351e-43d7-8949-779988773333',
  recommendation: 'STRONG_HIRE',
  confidence: 'HIGH',
  reasoning:
    'The candidate demonstrated exceptional leadership skills and technical depth across all competencies. Clear communication, strategic thinking, and team collaboration were evident throughout the interview.',
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
};

describe('write-assessment-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write the assessment, update the session status and return a success result', async () => {
    // Arrange
    vi.mocked(sessionService.updateSession).mockResolvedValue({ sessionId, status: 'ASSESSED' } as never);

    // Act
    const result = await handle({ jdId, sessionId, assessment: JSON.stringify(validValue) });

    // Assert
    expect(result).toEqual({ sessionId, status: 'ASSESSED', message: 'Assessment written successfully' });
    expect(sessionService.updateSession).toHaveBeenCalledWith(jdId, sessionId, {
      assessment: validValue,
      status: 'ASSESSED',
    });
  });

  it('should return an invalid format error when the assessment fails schema validation', async () => {
    // Act
    const result = await handle({ jdId, sessionId, assessment: JSON.stringify({ invalid: true }) });

    // Assert
    expect(result).toMatchObject({ error: 'Invalid assessment format' });
    expect(JSON.stringify(result)).toContain('validation failed');
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it('should return an invalid format error when the assessment is not valid JSON', async () => {
    // Act
    const result = await handle({ jdId, sessionId, assessment: 'not json' });

    // Assert
    expect(result).toMatchObject({ error: 'Invalid assessment format' });
    expect(JSON.stringify(result)).toContain('must be a valid JSON string');
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it.each([
    [{}],
    [{ jdId, sessionId }],
    [{ jdId, assessment: '{}' }],
    [{ sessionId, assessment: '{}' }],
    [{ jdId, sessionId, assessment: '' }],
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
    const result = await handle({ jdId, sessionId, assessment: JSON.stringify(validValue) });

    // Assert
    expect(result).toMatchObject({ error: 'Internal Server Error' });
  });
});

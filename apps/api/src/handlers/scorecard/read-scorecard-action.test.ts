import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/session-service', () => ({
  sessionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './read-scorecard-action';
import { sessionService } from '@/services/session-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '660e8400-e29b-41d4-a716-446655440001';
const baseSession = {
  sessionId,
  jdId,
  candidateName: 'Test',
  status: 'SCORED',
  createdAt: '2026-06-07T00:00:00Z',
  TTL: 1,
};

describe('read-scorecard-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the session scorecard', async () => {
    // Arrange
    const scorecard = { sample: 'data' };
    vi.mocked(sessionService.getById).mockResolvedValue({ ...baseSession, scorecard } as never);

    // Act
    const result = await handle({ jdId, sessionId });

    // Assert
    expect(result).toEqual(scorecard);
    expect(sessionService.getById).toHaveBeenCalledWith(jdId, sessionId);
  });

  it('should return a Not Found error when the session does not exist', async () => {
    // Arrange
    vi.mocked(sessionService.getById).mockResolvedValue(null as never);

    // Act
    const result = await handle({ jdId, sessionId });

    // Assert
    expect(result).toEqual({ error: 'Not Found', message: `Session with ID ${sessionId} not found` });
  });

  it.each([[undefined], [{}]])('should return a Not Found error when the scorecard is %j', async (scorecard) => {
    // Arrange
    vi.mocked(sessionService.getById).mockResolvedValue({ ...baseSession, scorecard } as never);

    // Act
    const result = await handle({ jdId, sessionId });

    // Assert
    expect(result).toEqual({
      error: 'Not Found',
      message: `Scorecard not available for session ${sessionId}. Session status is SCORED`,
    });
  });

  it.each([[{}], [{ jdId }], [{ sessionId }], [{ jdId: '', sessionId }]])(
    'should return an invalid arguments error for event %j',
    async (event) => {
      // Act
      const result = await handle(event);

      // Assert
      expect(result).toMatchObject({ error: 'Invalid tool arguments' });
      expect(sessionService.getById).not.toHaveBeenCalled();
    },
  );

  it('should return an Internal Server Error when the service throws', async () => {
    // Arrange
    vi.mocked(sessionService.getById).mockRejectedValue(new Error('DynamoDB connection failed'));

    // Act
    const result = await handle({ jdId, sessionId });

    // Assert
    expect(result).toMatchObject({ error: 'Internal Server Error' });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/job-description-service', () => ({
  jobDescriptionService: {
    getById: vi.fn(),
  },
}));

import { handle } from './read-jd-action';
import { jobDescriptionService } from '@/services/job-description-service';

const jdId = '550e8400-e29b-41d4-a716-446655440000';

describe('read-jd-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only the title and raw text of the job description', async () => {
    // Arrange
    vi.mocked(jobDescriptionService.getById).mockResolvedValue({
      jdId,
      title: 'Senior Backend Engineer',
      rawText: 'A job description.',
      s3Key: 'uploads/jd.pdf',
      createdAt: '2026-06-03T12:00:00.000Z',
      TTL: 1234567890,
    });

    // Act
    const result = await handle({ jdId });

    // Assert
    expect(result).toEqual({ title: 'Senior Backend Engineer', rawText: 'A job description.' });
    expect(jobDescriptionService.getById).toHaveBeenCalledWith(jdId);
  });

  it('should return a Not Found error when the job description does not exist', async () => {
    // Arrange
    vi.mocked(jobDescriptionService.getById).mockResolvedValue(null);

    // Act
    const result = await handle({ jdId });

    // Assert
    expect(result).toEqual({ error: 'Not Found', message: `Job description with ID ${jdId} not found` });
  });

  it.each([[{}], [{ jdId: '' }], [{ jobId: jdId }], [undefined]])(
    'should return an invalid arguments error for event %j',
    async (event) => {
      // Act
      const result = await handle(event);

      // Assert
      expect(result).toMatchObject({ error: 'Invalid tool arguments' });
      expect(jobDescriptionService.getById).not.toHaveBeenCalled();
    },
  );

  it('should return an Internal Server Error when the service throws', async () => {
    // Arrange
    vi.mocked(jobDescriptionService.getById).mockRejectedValue(new Error('DynamoDB connection failed'));

    // Act
    const result = await handle({ jdId });

    // Assert
    expect(result).toMatchObject({ error: 'Internal Server Error' });
  });
});

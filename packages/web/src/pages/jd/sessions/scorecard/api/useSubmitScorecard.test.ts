import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useSubmitScorecard } from './useSubmitScorecard';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';
const SESSION_ID = '660e8400-e29b-41d4-a716-446655440001';

const mockSession = {
  sessionId: SESSION_ID,
  jdId: JD_ID,
  candidateName: 'Jane Smith',
  status: 'PLAN_GENERATING' as const,
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('useSubmitScorecard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully trigger scorecard submission', async () => {
    // Arrange
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useSubmitScorecard(JD_ID, SESSION_ID));
    await result.current.mutateAsync();

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.post).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions/${SESSION_ID}/scorecard`);
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to submit scorecard', 500);
    vi.mocked(apiClient.post).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useSubmitScorecard(JD_ID, SESSION_ID));
    await result.current.mutateAsync().catch(() => {
      // Error expected
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('should have pending state during mutation', async () => {
    // Arrange
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockSession } as never), 100);
        }),
    );

    // Act
    const { result } = renderHookWithAllProviders(() => useSubmitScorecard(JD_ID, SESSION_ID));
    const promise = result.current.mutateAsync();

    // Assert
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    await promise;
  });
});

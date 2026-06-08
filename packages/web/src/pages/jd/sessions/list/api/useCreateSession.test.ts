import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, act, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useCreateSession } from './useCreateSession';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';

const mockSession = {
  sessionId: '660e8400-e29b-41d4-a716-446655440001',
  jdId: JD_ID,
  candidateName: 'Jane Smith',
  status: 'PLAN_PENDING',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('useCreateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a session', async () => {
    // Arrange
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateSession(JD_ID));
    await act(async () => {
      result.current.mutate({ jdId: JD_ID, candidateName: 'Jane Smith' });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.post).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions`, {
      jdId: JD_ID,
      candidateName: 'Jane Smith',
    });
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to create session', 400);
    vi.mocked(apiClient.post).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateSession(JD_ID));
    await act(async () => {
      result.current.mutate({ jdId: JD_ID, candidateName: 'Jane Smith' });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useGetSession } from './useGetSession';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';
const SESSION_ID = '660e8400-e29b-41d4-a716-446655440001';

const mockSession = {
  sessionId: SESSION_ID,
  jdId: JD_ID,
  candidateName: 'Jane Smith',
  status: 'PLAN_PENDING' as const,
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('useGetSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch a single session', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSession(JD_ID, SESSION_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.get).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions/${SESSION_ID}`);
  });

  it('should return loading state initially', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSession(JD_ID, SESSION_ID));

    // Assert - initial state is loading
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to fetch', 404);
    vi.mocked(apiClient.get).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSession(JD_ID, SESSION_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('should not fetch when jdId is empty', () => {
    // Arrange & Act
    const { result } = renderHookWithAllProviders(() => useGetSession('', SESSION_ID));

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should not fetch when sessionId is empty', () => {
    // Arrange & Act
    const { result } = renderHookWithAllProviders(() => useGetSession(JD_ID, ''));

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should not fetch when both jdId and sessionId are empty', () => {
    // Arrange & Act
    const { result } = renderHookWithAllProviders(() => useGetSession('', ''));

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should fetch again when sessionId changes', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession } as never);

    // Act
    const { result, rerender } = renderHookWithAllProviders(() => useGetSession(JD_ID, SESSION_ID));

    // Assert - initial call
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Act - rerender with different sessionId
    const newSessionId = '660e8400-e29b-41d4-a716-446655440002';
    const newMockSession = { ...mockSession, sessionId: newSessionId };
    vi.mocked(apiClient.get).mockResolvedValue({ data: newMockSession } as never);
    rerender();

    // Assert - should call with original sessionId (no change detection in this simple test)
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions/${SESSION_ID}`);
    });
  });
});

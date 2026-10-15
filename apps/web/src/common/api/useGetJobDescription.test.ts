import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useGetJobDescription } from './useGetJobDescription';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';

const mockJobDescription = {
  jdId: JD_ID,
  title: 'Senior Software Engineer',
  rawText: 'We are looking for a Senior Software Engineer with 5+ years of experience...',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('useGetJobDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch a single job description', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescription } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescription(JD_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockJobDescription);
    expect(apiClient.get).toHaveBeenCalledWith(`/jds/${JD_ID}`);
  });

  it('should return loading state initially', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescription } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescription(JD_ID));

    // Assert - initial state is loading
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to fetch', 500);
    vi.mocked(apiClient.get).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescription(JD_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('should not fetch when jdId is empty', () => {
    // Arrange & Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescription(''));

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should fetch again when jdId changes', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescription } as never);

    // Act - first call
    const { result: result1 } = renderHookWithAllProviders(() => useGetJobDescription(JD_ID));

    // Assert - initial call
    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescription } as never);

    // Act - second call with different ID
    const newJdId = '660e8400-e29b-41d4-a716-446655440002';
    const { result: result2 } = renderHookWithAllProviders(() => useGetJobDescription(newJdId));

    // Assert - should call with new ID
    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });
    expect(apiClient.get).toHaveBeenCalledWith(`/jds/${newJdId}`);
  });
});

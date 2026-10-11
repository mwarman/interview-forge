import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useGetJobDescriptions } from './useGetJobDescriptions';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockJobDescriptions = [
  {
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Senior Software Engineer',
    rawText: 'We are looking for a Senior Software Engineer...',
    createdAt: '2026-06-01T12:00:00Z',
    TTL: 9999999999,
  },
  {
    jdId: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Product Manager',
    rawText: 'We are looking for a Product Manager...',
    createdAt: '2026-06-02T12:00:00Z',
    TTL: 9999999999,
  },
];

describe('useGetJobDescriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch job descriptions', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescriptions } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescriptions());

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockJobDescriptions);
    expect(apiClient.get).toHaveBeenCalledWith('/jds');
  });

  it('should return loading state initially', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockJobDescriptions } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescriptions());

    // Assert - initial state is loading
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to fetch', 500);
    vi.mocked(apiClient.get).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetJobDescriptions());

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';

import { useGetSessions } from './useGetSessions';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockSessions = [
  {
    sessionId: '660e8400-e29b-41d4-a716-446655440001',
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    candidateName: 'Jane Smith',
    status: 'PLAN_PENDING',
    createdAt: '2026-06-01T12:00:00Z',
    TTL: 9999999999,
  },
  {
    sessionId: '660e8400-e29b-41d4-a716-446655440002',
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    candidateName: 'John Doe',
    status: 'COMPLETE',
    createdAt: '2026-06-02T12:00:00Z',
    TTL: 9999999999,
  },
];

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('useGetSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch sessions for a JD', async () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSessions } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSessions(JD_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSessions);
    expect(apiClient.get).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions`);
  });

  it('should not fetch when jdId is empty', () => {
    // Arrange
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSessions(''));

    // Assert - query is disabled with empty jdId
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to fetch sessions', 500);
    vi.mocked(apiClient.get).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useGetSessions(JD_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});

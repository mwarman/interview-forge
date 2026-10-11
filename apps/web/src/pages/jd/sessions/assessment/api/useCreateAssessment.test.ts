import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';

import { Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { renderHookWithAllProviders } from '@/test/test-utils';
import { useCreateAssessment } from './useCreateAssessment';

// Mock dependencies
vi.mock('@/common/utils/api-client');

describe('useCreateAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger assessment generation on mutate', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const mockSession: Session = {
      sessionId,
      jdId,
      candidateName: 'John Doe',
      status: 'ASSESS_GENERATING',
      createdAt: '2026-06-22T10:30:00Z',
      TTL: 1234567890,
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockSession } as AxiosResponse<Session>);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateAssessment(jdId, sessionId));
    result.current.mutate();

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.post).toHaveBeenCalledWith(`/jds/${jdId}/sessions/${sessionId}/assessment`);
  });

  it('should handle mutation error', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const mockError = new ApiError('Internal Server Error', 500);

    vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateAssessment(jdId, sessionId));
    result.current.mutate();

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toEqual(mockError);
  });

  it('should invalidate session queries on success', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const mockSession: Session = {
      sessionId,
      jdId,
      candidateName: 'John Doe',
      status: 'ASSESS_GENERATING',
      createdAt: '2026-06-22T10:30:00Z',
      TTL: 1234567890,
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockSession } as AxiosResponse<Session>);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateAssessment(jdId, sessionId));
    result.current.mutate();

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
  });
});

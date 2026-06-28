import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';

import { Session, ApproveAssessmentRequest } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { renderHookWithAllProviders } from '@/test/test-utils';
import { useApproveAssessment } from './useApproveAssessment';

// Mock dependencies
vi.mock('@/common/utils/api-client');

describe('useApproveAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should approve assessment without override', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const mockSession: Session = {
      sessionId,
      jdId,
      candidateName: 'John Doe',
      status: 'COMPLETE',
      createdAt: '2026-06-22T10:30:00Z',
      TTL: 1234567890,
    };

    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockSession } as AxiosResponse<Session>);

    // Act
    const { result } = renderHookWithAllProviders(() => useApproveAssessment(jdId, sessionId));
    result.current.mutate({});

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.put).toHaveBeenCalledWith(`/jds/${jdId}/sessions/${sessionId}/assessment/approve`, {});
  });

  it('should approve assessment with recommendation override', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const request: ApproveAssessmentRequest = {
      recommendation: 'HIRE',
      overrideReason: 'Strategic hire for team expansion',
    };
    const mockSession: Session = {
      sessionId,
      jdId,
      candidateName: 'John Doe',
      status: 'COMPLETE',
      createdAt: '2026-06-22T10:30:00Z',
      TTL: 1234567890,
    };

    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockSession } as AxiosResponse<Session>);

    // Act
    const { result } = renderHookWithAllProviders(() => useApproveAssessment(jdId, sessionId));
    result.current.mutate(request);

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockSession);
    expect(apiClient.put).toHaveBeenCalledWith(`/jds/${jdId}/sessions/${sessionId}/assessment/approve`, request);
  });

  it('should handle approval error', async () => {
    // Arrange
    const jdId = '123e4567-e89b-12d3-a456-426614174000';
    const sessionId = '223e4567-e89b-12d3-a456-426614174000';
    const mockError = new ApiError('Approval failed', 500);

    vi.mocked(apiClient.put).mockRejectedValueOnce(mockError);

    // Act
    const { result } = renderHookWithAllProviders(() => useApproveAssessment(jdId, sessionId));
    result.current.mutate({});

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toEqual(mockError);
  });
});

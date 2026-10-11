import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, waitFor } from '@/test/test-utils';
import { ApiError } from '@/common/utils/errors/api-error';
import { useApprovePlan } from './useApprovePlan';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';
const SESSION_ID = '660e8400-e29b-41d4-a716-446655440001';

const mockApprovedSession = {
  sessionId: SESSION_ID,
  jdId: JD_ID,
  candidateName: 'Jane Smith',
  status: 'PLAN_APPROVED' as const,
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

const mockApprovePlanRequest = {
  plan: {
    planId: 'plan-id-123',
    competencies: [],
    generatedAt: '2026-06-01T12:00:00Z',
  },
};

describe('useApprovePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully approve a plan', async () => {
    // Arrange
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockApprovedSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useApprovePlan(JD_ID, SESSION_ID));
    await result.current.mutateAsync(mockApprovePlanRequest);

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(mockApprovedSession);
    expect(apiClient.put).toHaveBeenCalledWith(
      `/jds/${JD_ID}/sessions/${SESSION_ID}/plan/approve`,
      mockApprovePlanRequest,
    );
  });

  it('should handle API errors', async () => {
    // Arrange
    const apiError = new ApiError('Failed to approve plan', 400);
    vi.mocked(apiClient.put).mockRejectedValue(apiError);

    // Act
    const { result } = renderHookWithAllProviders(() => useApprovePlan(JD_ID, SESSION_ID));
    await result.current.mutateAsync(mockApprovePlanRequest).catch(() => {
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
    vi.mocked(apiClient.put).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockApprovedSession } as never), 100);
        }),
    );

    // Act
    const { result } = renderHookWithAllProviders(() => useApprovePlan(JD_ID, SESSION_ID));
    const promise = result.current.mutateAsync(mockApprovePlanRequest);

    // Assert
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    await promise;
  });

  it('should accept optional plan in request', async () => {
    // Arrange
    const requestWithoutPlan = {};
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockApprovedSession } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useApprovePlan(JD_ID, SESSION_ID));
    await result.current.mutateAsync(requestWithoutPlan);

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(apiClient.put).toHaveBeenCalledWith(`/jds/${JD_ID}/sessions/${SESSION_ID}/plan/approve`, requestWithoutPlan);
  });
});

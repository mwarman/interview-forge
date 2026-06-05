import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '@/common/utils/api-client';
import { renderHookWithAllProviders, act, waitFor } from '@/test/test-utils';

import { useCreateJobDescription } from './useCreateJobDescription';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useCreateJobDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a job description in paste mode', async () => {
    // Arrange
    const mockResponse = {
      jdId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Senior Engineer',
      rawText: 'We are looking for a Senior Engineer...',
      s3Key: undefined,
      createdAt: '2026-06-04T12:00:00Z',
      TTL: 1719129600,
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateJobDescription());
    await act(async () => {
      result.current.mutate({
        mode: 'paste',
        title: 'Senior Engineer',
        rawText: 'We are looking for a Senior Engineer...',
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should successfully create a job description in upload mode', async () => {
    // Arrange
    const mockResponse = {
      jdId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Senior Engineer',
      rawText: 'Extracted from PDF...',
      s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
      createdAt: '2026-06-04T12:00:00Z',
      TTL: 1719129600,
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateJobDescription());
    await act(async () => {
      result.current.mutate({
        mode: 'upload',
        title: 'Senior Engineer',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle API errors', async () => {
    // Arrange
    const mockError = new Error('Validation Error');
    vi.mocked(apiClient.post).mockRejectedValue(mockError);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateJobDescription());
    await act(async () => {
      result.current.mutate({
        mode: 'paste',
        title: 'Senior Engineer',
        rawText: 'We are looking for a Senior Engineer...',
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should return isSuccess true after successful mutation', async () => {
    // Arrange
    const mockResponse = {
      jdId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Senior Engineer',
      rawText: 'We are looking for a Senior Engineer...',
      s3Key: undefined,
      createdAt: '2026-06-04T12:00:00Z',
      TTL: 1719129600,
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreateJobDescription());
    await act(async () => {
      result.current.mutate({
        mode: 'paste',
        title: 'Senior Engineer',
        rawText: 'We are looking for a Senior Engineer...',
      });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

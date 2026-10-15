import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithAllProviders, act, waitFor } from '@/test/test-utils';

import { apiClient } from '@/common/utils/api-client';

import { useCreatePresignedUrl } from './useCreatePresignedUrl';

vi.mock('@/common/utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useCreatePresignedUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch a pre-signed URL', async () => {
    // Arrange
    const mockResponse = {
      jdId: '550e8400-e29b-41d4-a716-446655440000',
      s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
      presignedUrl: 'https://s3.amazonaws.com/bucket/presigned-url',
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreatePresignedUrl());
    await act(async () => {
      result.current.mutate({ filename: 'resume.pdf' });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle API errors', async () => {
    // Arrange
    const mockError = new Error('API Error');
    vi.mocked(apiClient.post).mockRejectedValue(mockError);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreatePresignedUrl());
    await act(async () => {
      result.current.mutate({ filename: 'resume.pdf' });
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
      s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
      presignedUrl: 'https://s3.amazonaws.com/bucket/presigned-url',
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse } as never);

    // Act
    const { result } = renderHookWithAllProviders(() => useCreatePresignedUrl());
    await act(async () => {
      result.current.mutate({ filename: 'resume.pdf' });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

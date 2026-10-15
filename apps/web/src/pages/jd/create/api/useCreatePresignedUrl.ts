import { useMutation } from '@tanstack/react-query';

import { CreatePresignedUrlResponse } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Hook to fetch a pre-signed URL from the backend for direct S3 file upload.
 * On success, returns jdId, s3Key, and presignedUrl for S3 PUT operation.
 *
 * @returns useMutation hook for creating a pre-signed URL
 */
export const useCreatePresignedUrl = () => {
  return useMutation<CreatePresignedUrlResponse, ApiError, { filename: string }>({
    mutationFn: async ({ filename }) => {
      const response = await apiClient.post<CreatePresignedUrlResponse>('/jds/upload-url', {
        filename,
      });
      return response.data;
    },
  });
};

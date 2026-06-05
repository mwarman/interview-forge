import { useMutation } from '@tanstack/react-query';

import { CreateJobDescriptionRequest, JobDescription } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Hook to create a job description via paste or upload mode.
 *
 * Paste mode request: { mode: 'paste', title, rawText }
 * Upload mode request: { mode: 'upload', title, s3Key, jdId }
 *
 * @returns useMutation hook for creating a job description
 */
export const useCreateJobDescription = () => {
  return useMutation<JobDescription, ApiError, CreateJobDescriptionRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<JobDescription>('/jds', request);
      return response.data;
    },
  });
};

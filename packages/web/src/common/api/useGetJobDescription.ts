import { useQuery } from '@tanstack/react-query';

import { JobDescription } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to fetch a single job description by ID from GET /jds/:jdId.
 *
 * @param jdId - The job description identifier
 * @returns useQuery hook containing the JobDescription object
 */
export const useGetJobDescription = (jdId: string) => {
  return useQuery<JobDescription, ApiError>({
    queryKey: queryKeys.jobDescription(jdId),
    queryFn: async () => {
      const response = await apiClient.get<JobDescription>(`/jds/${jdId}`);
      return response.data;
    },
    enabled: !!jdId,
  });
};

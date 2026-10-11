import { useQuery } from '@tanstack/react-query';

import { JobDescription } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to fetch all job descriptions from GET /jds.
 *
 * @returns useQuery hook containing the list of JobDescription objects
 */
export const useGetJobDescriptions = () => {
  return useQuery<JobDescription[], ApiError>({
    queryKey: queryKeys.jobDescriptions(),
    queryFn: async () => {
      const response = await apiClient.get<JobDescription[]>('/jds');
      return response.data;
    },
  });
};

import { useQuery } from '@tanstack/react-query';

import { Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to fetch all sessions for a given JD from GET /jds/:jdId/sessions.
 *
 * @param jdId - The job description identifier
 * @returns useQuery hook containing the list of Session objects
 */
export const useGetSessions = (jdId: string) => {
  return useQuery<Session[], ApiError>({
    queryKey: queryKeys.sessions(jdId),
    queryFn: async () => {
      const response = await apiClient.get<Session[]>(`/jds/${jdId}/sessions`);
      return response.data;
    },
    enabled: !!jdId,
  });
};

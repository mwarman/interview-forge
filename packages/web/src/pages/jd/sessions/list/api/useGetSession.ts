import { useQuery } from '@tanstack/react-query';

import { Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Hook to fetch a single session by ID from GET /jds/:jdId/sessions/:sessionId.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @returns useQuery hook containing the Session object
 */
export const useGetSession = (jdId: string, sessionId: string) => {
  return useQuery<Session, ApiError>({
    queryKey: ['sessions', jdId, sessionId],
    queryFn: async () => {
      const response = await apiClient.get<Session>(`/jds/${jdId}/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!jdId && !!sessionId,
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateSessionRequest, Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to create a new session under a given JD via POST /jds/:jdId/sessions.
 * Invalidates the sessions query cache for the JD on success.
 *
 * @param jdId - The job description identifier
 * @returns useMutation hook for creating a session
 */
export const useCreateSession = (jdId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, CreateSessionRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<Session>(`/jds/${jdId}/sessions`, request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(jdId) });
    },
  });
};

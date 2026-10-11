import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Scorecard, Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to trigger scorecard submission via POST /jds/:jdId/sessions/:sessionId/scorecard.
 * Invalidates the session query cache on success so the session status updates.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @returns useMutation hook for submitting a scorecard
 */
export const useSubmitScorecard = (jdId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, Scorecard>({
    mutationFn: async (scorecard: Scorecard) => {
      const response = await apiClient.post<Session>(`/jds/${jdId}/sessions/${sessionId}/scorecard`, scorecard);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(jdId), exact: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(jdId, sessionId) });
    },
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Hook to trigger plan generation via POST /jds/:jdId/sessions/:sessionId/plan.
 * Invalidates the session query cache on success so the session status updates.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @returns useMutation hook for creating/triggering a plan
 */
export const useCreatePlan = (jdId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, void>({
    mutationFn: async () => {
      const response = await apiClient.post<Session>(`/jds/${jdId}/sessions/${sessionId}/plan`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', jdId, sessionId] });
    },
  });
};

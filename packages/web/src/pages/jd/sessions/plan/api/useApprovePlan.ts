import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApprovePlanRequest, Session } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Hook to approve and save a plan via PUT /jds/:jdId/sessions/:sessionId/plan/approve.
 * Sends the (potentially modified) plan from local state and transitions session status to PLAN_APPROVED.
 * Invalidates the session query cache on success.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @returns useMutation hook for approving a plan
 */
export const useApprovePlan = (jdId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, ApprovePlanRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.put<Session>(`/jds/${jdId}/sessions/${sessionId}/plan/approve`, request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', jdId, sessionId] });
    },
  });
};

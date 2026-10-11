import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Session, ApproveAssessmentRequest } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';
import { queryKeys } from '@/common/utils/query-client';

/**
 * Hook to approve an assessment via PUT /jds/:jdId/sessions/:sessionId/assessment/approve.
 * Accepts optional recommendation override and override reason.
 * Invalidates the session query cache on success so the session status updates.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @returns useMutation hook for approving an assessment
 */
export const useApproveAssessment = (jdId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, ApproveAssessmentRequest>({
    mutationFn: async (request: ApproveAssessmentRequest) => {
      const response = await apiClient.put<Session>(`/jds/${jdId}/sessions/${sessionId}/assessment/approve`, request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(jdId), exact: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(jdId, sessionId) });
    },
  });
};

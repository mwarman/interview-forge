import { useQuery } from '@tanstack/react-query';

import { Session, SessionStatus } from '@interview-forge/shared';
import { apiClient } from '@/common/utils/api-client';
import { ApiError } from '@/common/utils/errors/api-error';

/**
 * Options for controlling session polling behavior
 */
interface UseGetSessionOptions {
  /**
   * Array of session statuses that should trigger polling.
   * When provided, the query will automatically refetch at the specified interval
   * while the session status is in this array, and stop when the status changes.
   */
  pollingStatuses?: SessionStatus[];

  /**
   * Interval in milliseconds for refetching when polling is active.
   * Defaults to 10000ms (10 seconds) when pollingStatuses is provided.
   */
  refetchIntervalMs?: number;
}

/**
 * Hook to fetch a single session by ID from GET /jds/:jdId/sessions/:sessionId.
 * Supports optional conditional polling based on session status.
 *
 * @param jdId - The job description identifier
 * @param sessionId - The session identifier
 * @param options - Optional polling configuration
 * @returns useQuery hook containing the Session object
 *
 * @example
 * // Simple fetch
 * const query = useGetSession(jdId, sessionId);
 *
 * @example
 * // Fetch with polling while PLAN_GENERATING
 * const query = useGetSession(jdId, sessionId, {
 *   pollingStatuses: ['PLAN_GENERATING'],
 *   refetchIntervalMs: 10000
 * });
 */
export const useGetSession = (jdId: string, sessionId: string, options?: UseGetSessionOptions) => {
  const isEnabled = !!jdId && !!sessionId;
  const pollingStatuses = options?.pollingStatuses;
  const refetchIntervalMs = options?.refetchIntervalMs ?? 10000;

  return useQuery<Session, ApiError>({
    queryKey: ['sessions', jdId, sessionId],
    queryFn: async () => {
      const response = await apiClient.get<Session>(`/jds/${jdId}/sessions/${sessionId}`);
      return response.data;
    },
    enabled: isEnabled,
    /**
     * Dynamic refetchInterval function that controls polling behavior.
     * When pollingStatuses is provided, inspects the current session status
     * and returns false to stop polling when status transitions out of the array.
     */
    refetchInterval:
      pollingStatuses && isEnabled
        ? (data) => {
            const session = data.state.data;

            // If no data yet, don't poll
            if (!session) {
              return false;
            }

            // Check if current status is in the polling statuses array
            const shouldContinuePolling = pollingStatuses.includes(session.status);

            // Return interval time if polling should continue, false to stop
            return shouldContinuePolling ? refetchIntervalMs : false;
          }
        : undefined,
  });
};

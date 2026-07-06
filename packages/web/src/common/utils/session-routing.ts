/**
 * Determines the target route based on session status.
 * - SCORED → assessment page
 * - PLAN_APPROVED → scorecard page
 * - All other statuses → plan page (default)
 *
 * @param jdId - The job description ID
 * @param sessionId - The session ID
 * @param status - The session status
 * @returns The target route path
 */
export const getSessionRoute = (jdId: string, sessionId: string, status: string): string => {
  switch (status) {
    case 'PLAN_PENDING':
    case 'PLAN_GENERATING':
    case 'PLAN_ERROR':
    case 'PLAN_GENERATED':
      return `/jds/${jdId}/sessions/${sessionId}/plan`;
    case 'PLAN_APPROVED':
      return `/jds/${jdId}/sessions/${sessionId}/scorecard`;
    case 'SCORED':
    case 'ASSESS_GENERATING':
    case 'ASSESS_ERROR':
    case 'ASSESSED':
    case 'COMPLETE':
      return `/jds/${jdId}/sessions/${sessionId}/assessment`;
    default:
      return `/jds/${jdId}/sessions/${sessionId}/detail`;
  }
};

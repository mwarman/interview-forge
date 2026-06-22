import { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { Session } from '@interview-forge/shared';
import { Card, CardContent } from '@/common/components/shadcn/card';
import { SessionStatusBadge } from '@/common/components/session-status/SessionStatusBadge';

/**
 * Determines the target route based on session status.
 * - SCORED → detail page
 * - PLAN_APPROVED → scorecard page
 * - All other statuses → plan page (default)
 */
const getRouteForStatus = (jdId: string, sessionId: string, status: string): string => {
  switch (status) {
    case 'SCORED':
      return `/jds/${jdId}/sessions/${sessionId}/detail`;
    case 'PLAN_APPROVED':
      return `/jds/${jdId}/sessions/${sessionId}/scorecard`;
    default:
      return `/jds/${jdId}/sessions/${sessionId}/plan`;
  }
};

interface SessionCardProps {
  session: Session;
}

/**
 * SessionCard component - displays a single session with candidate name and status badge.
 * Navigation behavior depends on session status:
 * - SCORED: navigate to detail page
 * - PLAN_APPROVED: navigate to scorecard page
 * - Other statuses: navigate to plan page
 *
 * @param session - The Session object to display
 * @returns {JSX.Element} The SessionCard component
 */
export const SessionCard = ({ session }: SessionCardProps): JSX.Element => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const route = getRouteForStatus(session.jdId, session.sessionId, session.status);
    navigate(route);
  };

  return (
    <Card
      size="sm"
      className="hover:ring-primary/30 cursor-pointer transition-shadow"
      data-testid="session-card"
      onClick={handleCardClick}
    >
      <CardContent className="flex items-center justify-between">
        <span data-testid="session-candidate-name" className="truncate font-medium">
          {session.candidateName}
        </span>
        <SessionStatusBadge status={session.status} />
      </CardContent>
    </Card>
  );
};

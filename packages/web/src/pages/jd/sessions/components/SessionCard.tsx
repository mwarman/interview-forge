import { JSX } from 'react';

import { Session } from '@interview-forge/shared';
import { Badge } from '@/common/components/shadcn/badge';
import { Card, CardContent } from '@/common/components/shadcn/card';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PLAN_PENDING: 'outline',
  PLAN_APPROVED: 'secondary',
  SCORED: 'secondary',
  ASSESSED: 'default',
  COMPLETE: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  PLAN_PENDING: 'Plan Pending',
  PLAN_APPROVED: 'Plan Approved',
  SCORED: 'Scored',
  ASSESSED: 'Assessed',
  COMPLETE: 'Complete',
};

interface SessionCardProps {
  session: Session;
}

/**
 * SessionCard component - displays a single session with candidate name and status badge.
 *
 * @param session - The Session object to display
 * @returns {JSX.Element} The SessionCard component
 */
export const SessionCard = ({ session }: SessionCardProps): JSX.Element => {
  return (
    <Card size="sm" data-testid="session-card">
      <CardContent className="flex items-center justify-between">
        <span data-testid="session-candidate-name" className="truncate font-medium">
          {session.candidateName}
        </span>
        <Badge variant={STATUS_VARIANT[session.status] ?? 'outline'} data-testid="session-status-badge">
          {STATUS_LABEL[session.status] ?? session.status}
        </Badge>
      </CardContent>
    </Card>
  );
};

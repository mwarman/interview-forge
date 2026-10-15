import { JSX } from 'react';

import { Badge } from '@/common/components/shadcn/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PLAN_PENDING: 'outline',
  PLAN_GENERATING: 'outline',
  PLAN_GENERATED: 'outline',
  PLAN_ERROR: 'destructive',
  PLAN_APPROVED: 'secondary',
  SCORED: 'secondary',
  ASSESS_GENERATING: 'outline',
  ASSESS_ERROR: 'destructive',
  ASSESSED: 'default',
  COMPLETE: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  PLAN_PENDING: 'Plan Pending',
  PLAN_GENERATING: 'Generating Plan',
  PLAN_GENERATED: 'Plan Generated',
  PLAN_ERROR: 'Plan Error',
  PLAN_APPROVED: 'Plan Approved',
  SCORED: 'Scored',
  ASSESS_GENERATING: 'Generating Assessment',
  ASSESS_ERROR: 'Assessment Error',
  ASSESSED: 'Assessed',
  COMPLETE: 'Complete',
};

interface SessionStatusBadgeProps {
  /**
   * The session status value
   */
  status: string;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * SessionStatusBadge component - displays a badge for the session status with appropriate color.
 * Centralizes the status-to-badge-variant and status-to-label mappings for DRY principle.
 *
 * @param status - The session status value
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The SessionStatusBadge component
 */
export const SessionStatusBadge = ({
  status,
  testId = 'session-status-badge',
}: SessionStatusBadgeProps): JSX.Element => {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'outline'} data-testid={testId}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
};

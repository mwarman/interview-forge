import { JSX } from 'react';
import { AlertCircleIcon } from 'lucide-react';

import { Skeleton } from '@/common/components/shadcn/skeleton';

interface PlanGeneratingStateProps {
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * PlanGeneratingState component - displays a non-blocking loading indicator
 * while the plan is being generated. Shows an animated skeleton with descriptive label.
 * Used with useGetSession polling until status transitions away from PLAN_GENERATING.
 *
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The PlanGeneratingState component
 */
export const PlanGeneratingState = ({ testId = 'plan-generating-state' }: PlanGeneratingStateProps): JSX.Element => {
  return (
    <div data-testid={testId} className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex items-center gap-3">
        <AlertCircleIcon className="h-5 w-5 animate-pulse text-blue-600" />
        <h2 className="text-foreground text-lg font-semibold">Generating your interview plan…</h2>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      <p className="text-muted-foreground text-sm">This may take a few moments. Please wait.</p>
    </div>
  );
};

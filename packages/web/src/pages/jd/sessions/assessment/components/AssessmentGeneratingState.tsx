import { JSX } from 'react';

import { Skeleton } from '@/common/components/shadcn/skeleton';

interface AssessmentGeneratingStateProps {
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * AssessmentGeneratingState component - displays a non-blocking loading indicator
 * while the assessment is being generated. Shows an animated skeleton with descriptive label.
 * Used with useGetSession polling until status transitions away from ASSESS_GENERATING.
 *
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The AssessmentGeneratingState component
 */
export const AssessmentGeneratingState = ({
  testId = 'assessment-generating-state',
}: AssessmentGeneratingStateProps): JSX.Element => {
  return (
    <div data-testid={testId} className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Generating assessment…</h2>
        <p className="text-muted-foreground mt-2 text-sm">This may take a few moments. Please wait.</p>
      </div>

      <Skeleton className="h-72 rounded-lg" />

      <div className="flex justify-between">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
};

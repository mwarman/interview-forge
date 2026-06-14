import { JSX } from 'react';
import { AlertTriangleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Button } from '@/common/components/shadcn/button';

interface PlanErrorStateProps {
  /**
   * Error message from session.planErrorMessage
   */
  errorMessage: string;

  /**
   * Callback fired when "Retry Generation" button is clicked
   */
  onRetry: () => void;

  /**
   * Whether the retry button is in a loading state
   */
  isRetrying?: boolean;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * PlanErrorState component - displays an error message and a retry button
 * when plan generation encounters an error.
 *
 * @param errorMessage - Error message from session.planErrorMessage
 * @param onRetry - Callback fired when "Retry Generation" button is clicked
 * @param isRetrying - Whether the retry button is in a loading state
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The PlanErrorState component
 */
export const PlanErrorState = ({
  errorMessage,
  onRetry,
  isRetrying = false,
  testId = 'plan-error-state',
}: PlanErrorStateProps): JSX.Element => {
  return (
    <div data-testid={testId} className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Plan Generation Failed</AlertTitle>
        <AlertDescription data-testid="error-message">{errorMessage}</AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Button onClick={onRetry} disabled={isRetrying} data-testid="retry-generation-button">
          {isRetrying ? 'Retrying…' : 'Retry Generation'}
        </Button>
      </div>
    </div>
  );
};

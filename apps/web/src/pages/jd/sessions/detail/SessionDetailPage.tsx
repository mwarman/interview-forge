import { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, AlertCircleIcon } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { useGetSession } from '@/common/api/useGetSession';
import { SessionStatusBadge } from '@/common/components/session-status/SessionStatusBadge';

/**
 * SessionDetailPage component - displays the session details including candidate name,
 * current status (with dynamic badge reflecting the actual session status), and a
 * call-to-action button for the next action in the workflow.
 *
 * @returns {JSX.Element} The SessionDetailPage component
 */
export const SessionDetailPage = (): JSX.Element => {
  const { jdId, sessionId } = useParams<{ jdId: string; sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session to display details
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useGetSession(jdId ?? '', sessionId ?? '');

  // Loading state
  if (isSessionLoading) {
    return (
      <div data-testid="session-detail-page-loading" className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:px-6">
        <div className="bg-muted h-8 max-w-96 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Error state
  if (isSessionError || !session) {
    return (
      <div data-testid="session-detail-page-error" className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Failed to load session</AlertTitle>
          <AlertDescription>Could not fetch the session data. Please try again or go back.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div data-testid="session-detail-page" className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(-1)}
          data-testid="back-button"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
          <span className="sr-only">Go back</span>
        </Button>
        <h1 className="flex-1 text-2xl font-bold">{session.candidateName}</h1>
      </div>

      {/* Session details card */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <div data-testid="session-detail-candidate-name">
          <h2 className="text-muted-foreground text-sm font-medium">Candidate</h2>
          <p className="text-lg font-semibold">{session.candidateName}</p>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">Current Status</h2>
          <SessionStatusBadge status={session.status} />
        </div>

        <div className="border-t pt-4">
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">Created</h2>
          <p className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Call-to-action section based on status */}
      <div className="space-y-4">
        {session.status === 'SCORED' && (
          <Alert data-testid="assessment-cta">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Ready for Assessment</AlertTitle>
            <AlertDescription>
              The interview has been scored. Generate an assessment to get detailed feedback and recommendations.
            </AlertDescription>
          </Alert>
        )}

        {session.status === 'ASSESSED' && (
          <Alert data-testid="complete-cta">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Assessment Complete</AlertTitle>
            <AlertDescription>
              The interview assessment has been completed. You can now review the final recommendations.
            </AlertDescription>
          </Alert>
        )}

        {session.status === 'COMPLETE' && (
          <Alert data-testid="complete-cta">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Interview Complete</AlertTitle>
            <AlertDescription>The interview process has been completed. All steps have been finished.</AlertDescription>
          </Alert>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          {session.status === 'SCORED' && (
            <Button data-testid="generate-assessment-button" disabled>
              Generate Assessment (Coming Soon)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

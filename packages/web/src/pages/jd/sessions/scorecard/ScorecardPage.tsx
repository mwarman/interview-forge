import { JSX, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircleIcon, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Button } from '@/common/components/shadcn/button';
import { useGetSession } from '@/common/api/useGetSession';
import { getSessionRoute } from '@/common/utils/session-routing';
import { ScorecardForm } from './components/ScorecardForm';
import { SkeletonLoaderBlock } from '@/common/components/loader/SkeletonLoaderBlock';

/**
 * ScorecardPage component - orchestrates the scorecard entry form.
 * Loads the session and plan, validates that status is PLAN_APPROVED,
 * and renders the scoring form for all competencies and questions.
 *
 * On successful submission, navigates to the session detail page.
 *
 * @returns {JSX.Element | null} The ScorecardPage component
 */
export const ScorecardPage = (): JSX.Element | null => {
  const { jdId, sessionId } = useParams<{ jdId: string; sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session to get plan and validate status
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useGetSession(jdId ?? '', sessionId ?? '');

  /**
   * Redirect if session status is not PLAN_APPROVED
   */
  useEffect(() => {
    if (session && session.status !== 'PLAN_APPROVED') {
      toast.info('Scorecard is only available for approved plans. Redirecting...');
      const route = getSessionRoute(jdId ?? '', sessionId ?? '', session.status);
      navigate(route, { replace: true });
    }
  }, [session?.status, jdId, sessionId, navigate]);

  // Loading state
  if (isSessionLoading) {
    return (
      <SkeletonLoaderBlock
        title="Loading Session"
        description="Please wait while we load your session."
        icon={<ArrowDownToLine className="mb-4 size-16" />}
        testId="scorecard-page-loading"
      />
    );
  }

  // Session load error state
  if (isSessionError || !session) {
    return (
      <div data-testid="session-load-error" className="mx-auto max-w-2xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load session</AlertTitle>
          <AlertDescription className="my-2 space-y-2">
            <div>Could not fetch the session data. Please try again or go back.</div>
            <Button
              size="xs"
              onClick={() => navigate(-1)}
              data-testid="scorecard-page-go-back-button"
              aria-label="Go Back"
            >
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Session status error state
  if (session.status !== 'PLAN_APPROVED' || !session.plan) {
    return (
      <div data-testid="session-status-error" className="mx-auto max-w-2xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Invalid Session Status</AlertTitle>
          <AlertDescription className="my-2 space-y-2">
            <div>Scorecard is only available for approved plans.</div>
            <Button
              size="xs"
              onClick={() => navigate(`/jds/${jdId}/sessions`, { replace: true })}
              data-testid="return-to-sessions-button"
              aria-label="Return to Sessions"
            >
              Return to Sessions
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show scorecard state
  return (
    <div data-testid="scorecard-page" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Score the Interview</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Please fill out the scorecard below and submit your scores.
        </p>
      </div>

      <ScorecardForm session={session} />
    </div>
  );
};

import { JSX, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Button } from '@/common/components/shadcn/button';
import { useGetSession } from '@/common/api/useGetSession';
import { ScorecardForm } from './components/ScorecardForm';

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
      navigate(`/jds/${jdId}/sessions/`, { replace: true });
    }
  }, [session?.status, jdId, sessionId, navigate]);

  // Loading state
  if (isSessionLoading) {
    return (
      <div data-testid="scorecard-page-loading" className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="bg-muted h-8 max-w-96 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Error state
  if (isSessionError || !session) {
    return (
      <div data-testid="scorecard-page-error" className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Failed to load session</AlertTitle>
          <AlertDescription>Could not fetch the session data. Please try again or go back.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Guard: Only show scorecard if plan is approved
  if (session.status !== 'PLAN_APPROVED' || !session.plan) {
    // TODO: Rendering nothing is a poor user experience - we should ideally show a message that scorecard is not available and redirect after a few seconds, but for now we'll just return null
    return null;
  }

  return (
    <div data-testid="scorecard-page" className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
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
        <h1 className="flex-1 text-2xl font-bold">Score Interview: {session.candidateName}</h1>
      </div>

      {/* Form */}
      <ScorecardForm session={session} />
    </div>
  );
};

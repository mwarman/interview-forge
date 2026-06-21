import { JSX, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, FileCheckCorner } from 'lucide-react';
import { toast } from 'sonner';

import { ApprovePlanRequest, InterviewPlan } from '@interview-forge/shared';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { Button } from '@/common/components/shadcn/button';
import { useGetSession } from '@/common/api/useGetSession';
import { useCreatePlan } from './api/useCreatePlan';
import { useApprovePlan } from './api/useApprovePlan';
import { PlanGeneratingState } from './components/PlanGeneratingState';
import { PlanErrorState } from './components/PlanErrorState';
import { PlanReadyState } from './components/PlanReadyState';

/**
 * PlanPage component - orchestrates the plan review and edit page.
 * Handles three distinct states based on session.status:
 * - PLAN_GENERATING: Shows loading indicator with polling
 * - PLAN_ERROR: Shows error message with retry button
 * - PLAN_GENERATED: Shows full plan editing UI
 *
 * On mount, triggers plan generation if not already in progress or complete.
 * On successful approval, navigates to a read-only confirmation view.
 *
 * @returns {JSX.Element} The PlanPage component
 */
export const PlanPage = (): JSX.Element => {
  const { jdId, sessionId } = useParams<{ jdId: string; sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session with polling support
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useGetSession(jdId ?? '', sessionId ?? '', {
    pollingStatuses: ['PLAN_GENERATING'],
    refetchIntervalMs: 10000,
  });

  // Mutations for creating and approving plans
  const createPlanMutation = useCreatePlan(jdId ?? '', sessionId ?? '');
  const approvePlanMutation = useApprovePlan(jdId ?? '', sessionId ?? '');

  /**
   * On mount, kick off plan generation if:
   * - Session exists and is not already generating/generated/approved/errored
   */
  useEffect(() => {
    if (
      session &&
      session.status !== 'PLAN_GENERATING' &&
      session.status !== 'PLAN_GENERATED' &&
      session.status !== 'PLAN_APPROVED' &&
      session.status !== 'PLAN_ERROR'
    ) {
      createPlanMutation.mutate();
    }
  }, [session?.sessionId]);

  /**
   * Handle plan approval success
   */
  useEffect(() => {
    if (approvePlanMutation?.isSuccess) {
      toast.success('Plan approved successfully!');
      navigate(`/jds/${jdId}/sessions`, { replace: true });
    }
  }, [approvePlanMutation?.isSuccess]);

  /**
   * Handle error states
   */
  useEffect(() => {
    if (createPlanMutation?.isError) {
      toast.error(`Failed to generate plan: ${createPlanMutation.error?.message}`);
    }
  }, [createPlanMutation?.isError]);

  useEffect(() => {
    if (approvePlanMutation?.isError) {
      toast.error(`Failed to approve plan: ${approvePlanMutation.error?.message}`);
    }
  }, [approvePlanMutation?.isError]);

  // Loading state
  if (isSessionLoading) {
    return (
      <div data-testid="plan-page-loading" className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="bg-muted h-8 max-w-96 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Error state
  if (isSessionError || !session) {
    return (
      <div data-testid="plan-page-error" className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Failed to load session</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Could not fetch the session data. Please try again or go back.
          </p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="plan-page" className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(-1)}
          data-testid="back-button"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
          <span className="sr-only">Go back to sessions</span>
        </Button>
        <h1 className="flex-1 text-2xl font-bold">Interview Plan for {session.candidateName}</h1>
      </div>

      {/* State-based content */}
      {session.status === 'PLAN_GENERATING' && <PlanGeneratingState />}

      {session.status === 'PLAN_ERROR' && (
        <PlanErrorState
          errorMessage={session?.planErrorMessage || 'Unknown error occurred during plan generation'}
          onRetry={() => createPlanMutation.mutate()}
          isRetrying={createPlanMutation.isPending}
        />
      )}

      {session.status === 'PLAN_GENERATED' && session.plan && (
        <PlanReadyState
          plan={session.plan as InterviewPlan}
          onApprovePlan={(editedPlan) => {
            const request: ApprovePlanRequest = { plan: editedPlan };
            approvePlanMutation.mutate(request);
          }}
          isApproving={approvePlanMutation.isPending}
        />
      )}

      {session.status === 'PLAN_APPROVED' && (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
          <Alert
            className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50"
            data-testid="plan-approved-state"
          >
            <FileCheckCorner className="mb-4 h-10 w-10 text-green-400" />
            <AlertTitle>Plan Approved</AlertTitle>
            <AlertDescription>
              <div className="flex flex-col gap-2">
                Your interview plan has been approved and is ready for the next phase.
                <Button onClick={() => navigate(-1)} variant="default" size="xs" className="self-start">
                  Return to Sessions
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

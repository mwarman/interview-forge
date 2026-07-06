import { JSX, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Assessment, ApproveAssessmentRequest, Recommendation } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { useGetSession } from '@/common/api/useGetSession';
import { useCreateAssessment } from './api/useCreateAssessment';
import { useApproveAssessment } from './api/useApproveAssessment';
import { AssessmentErrorState } from './components/AssessmentErrorState';
import { AssessmentReadyState } from './components/AssessmentReadyState';
import { AssessmentCompleteState } from './components/AssessmentCompleteState';
import { SkeletonLoaderBlock } from '@/common/components/loader/SkeletonLoaderBlock';
import { AlertCircleIcon, ArrowDownToLine, Form } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';

/**
 * AssessmentPage component - orchestrates the assessment review and approval page.
 * Handles four distinct states based on session.status:
 * - ASSESS_GENERATING: Shows loading indicator with polling
 * - ASSESS_ERROR: Shows error message with retry button
 * - ASSESSED: Shows full assessment editing UI with approval buttons
 * - COMPLETE: Shows read-only assessment with PDF export button
 *
 * On mount, triggers assessment generation if not already in progress or complete.
 * On successful approval, transitions to read-only COMPLETE state.
 *
 * @returns {JSX.Element} The AssessmentPage component
 */
export const AssessmentPage = (): JSX.Element => {
  const { jdId, sessionId } = useParams<{ jdId: string; sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session with polling support
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useGetSession(jdId ?? '', sessionId ?? '', {
    pollingStatuses: ['ASSESS_GENERATING'],
    refetchIntervalMs: 10000,
  });

  // Mutations for creating and approving assessments
  const createAssessmentMutation = useCreateAssessment(jdId ?? '', sessionId ?? '');
  const approveAssessmentMutation = useApproveAssessment(jdId ?? '', sessionId ?? '');

  /**
   * On mount, kick off assessment generation if:
   * - Session exists and is SCORED (not already generating/assessed/complete)
   */
  useEffect(() => {
    if (session && session.status === 'SCORED') {
      createAssessmentMutation.mutate();
    }
  }, [session?.sessionId]);

  /**
   * Handle assessment approval success
   */
  useEffect(() => {
    if (approveAssessmentMutation?.isSuccess) {
      toast.success('Assessment approved successfully!');
    }
  }, [approveAssessmentMutation?.isSuccess]);

  /**
   * Handle error states
   */
  useEffect(() => {
    if (createAssessmentMutation?.isError) {
      toast.error(`Failed to generate assessment: ${createAssessmentMutation.error?.message}`);
    }
  }, [createAssessmentMutation?.isError]);

  useEffect(() => {
    if (approveAssessmentMutation?.isError) {
      toast.error(`Failed to approve assessment: ${approveAssessmentMutation.error?.message}`);
    }
  }, [approveAssessmentMutation?.isError]);

  // Loading state
  if (isSessionLoading) {
    return (
      <SkeletonLoaderBlock
        title="Loading Session"
        description="Please wait while we load your session."
        icon={<ArrowDownToLine className="mb-4 size-16" />}
        testId="assessment-page-loading"
      />
    );
  }

  // Error state
  if (isSessionError || !session) {
    return (
      <div data-testid="assessment-page-error" className="mx-auto max-w-2xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load session</AlertTitle>
          <AlertDescription className="my-2 space-y-2">
            <div>Could not fetch the session data. Please try again or go back.</div>
            <Button
              size="xs"
              onClick={() => navigate(-1)}
              data-testid="assessment-page-error-go-back-button"
              aria-label="Go Back"
            >
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div data-testid="assessment-page">
      {/* State-based content */}
      {session.status === 'ASSESS_GENERATING' && (
        <SkeletonLoaderBlock
          title="Generating Assessment"
          description="This may take a few moments. Please wait."
          icon={<Form className="mb-4 size-16" />}
          testId="assessment-generating-state"
        />
      )}

      {session.status === 'ASSESS_ERROR' && (
        <AssessmentErrorState
          errorMessage={session?.assessErrorMessage || 'Unknown error occurred during assessment generation'}
          onRetry={() => createAssessmentMutation.mutate()}
          isRetrying={createAssessmentMutation.isPending}
        />
      )}

      {session.status === 'ASSESSED' && session.assessment && (
        <AssessmentReadyState
          assessment={session.assessment as Assessment}
          onApprove={() => {
            const request: ApproveAssessmentRequest = {};
            approveAssessmentMutation.mutate(request);
          }}
          onApproveWithOverride={(data) => {
            const request: ApproveAssessmentRequest = {
              recommendation: data.recommendation as Recommendation,
              overrideReason: data.overrideReason,
            };
            approveAssessmentMutation.mutate(request);
          }}
          isApproving={approveAssessmentMutation.isPending}
        />
      )}

      {session.status === 'COMPLETE' && session.assessment && (
        <AssessmentCompleteState
          assessment={session.assessment as Assessment}
          onExportPdf={() => {
            // TODO: Implement PDF export in future story
            toast.info('PDF export coming soon');
          }}
        />
      )}
    </div>
  );
};

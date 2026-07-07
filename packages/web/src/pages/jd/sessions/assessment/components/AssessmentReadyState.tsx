import { JSX, useState } from 'react';

import { Assessment, Confidence, Recommendation } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { RecommendationBadge } from './RecommendationBadge';
import { CompetencyAssessmentCard } from './CompetencyAssessmentCard';
import { ApproveWithOverrideDialog } from './ApproveWithOverrideDialog';

interface AssessmentReadyStateProps {
  /**
   * The assessment from session.assessment
   */
  assessment: Assessment;

  /**
   * Callback fired when "Approve Assessment" button is clicked (no override)
   */
  onApprove: () => void;

  /**
   * Callback fired when override dialog confirms with override data
   */
  onApproveWithOverride: (data: { overrideRecommendation: Recommendation; overrideReasoning: string }) => void;

  /**
   * Whether the approve buttons are in a loading state
   */
  isApproving?: boolean;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

const confidenceLabelMap: Record<Confidence, string> = {
  HIGH: 'High Confidence',
  MEDIUM: 'Medium Confidence',
  LOW: 'Low Confidence',
};

/**
 * AssessmentReadyState component - renders the full assessment review UI when assessment is complete.
 * Displays recommendation badge, confidence, reasoning, per-competency assessments, and approval actions.
 *
 * @param assessment - The assessment from session.assessment
 * @param onApprove - Callback fired when "Approve Assessment" button is clicked
 * @param onApproveWithOverride - Callback fired when override dialog confirms
 * @param isApproving - Whether the approve buttons are in a loading state
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The AssessmentReadyState component
 */
export const AssessmentReadyState = ({
  assessment,
  onApprove,
  onApproveWithOverride,
  isApproving = false,
  testId = 'assessment-ready-state',
}: AssessmentReadyStateProps): JSX.Element => {
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);

  return (
    <div data-testid={testId} className="space-y-6">
      {/* Recommendation Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                Recommendation
              </CardDescription>
              <div className="mt-2">
                <RecommendationBadge recommendation={assessment.recommendation} testId="summary-recommendation-badge" />
              </div>
            </div>
            <div>
              <CardDescription className="text-xs font-semibold tracking-wide uppercase">Confidence</CardDescription>
              <p className="mt-2 text-sm font-medium">{confidenceLabelMap[assessment.confidence]}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <CardDescription className="text-foreground font-semibold">Reasoning</CardDescription>
            <p className="text-sm leading-relaxed">{assessment.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Competency Assessment Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Competency Assessments</h3>
        {assessment.competencyAssessments.map((competency) => (
          <CompetencyAssessmentCard key={competency.competencyId} competency={competency} />
        ))}
      </div>

      {/* Approval Actions */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onApprove} disabled={isApproving} data-testid="approve-assessment-button" className="flex-1">
          {isApproving ? 'Approving…' : 'Approve Assessment'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsOverrideDialogOpen(true)}
          disabled={isApproving}
          data-testid="approve-with-override-button"
          className="flex-1"
        >
          Approve with Override
        </Button>
      </div>

      {/* Override Dialog */}
      <ApproveWithOverrideDialog
        isOpen={isOverrideDialogOpen}
        onOpenChange={setIsOverrideDialogOpen}
        onConfirm={onApproveWithOverride}
        isLoading={isApproving}
      />
    </div>
  );
};

import { JSX } from 'react';
import { Download } from 'lucide-react';

import { Assessment, Confidence } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { RecommendationBadge } from './RecommendationBadge';
import { CompetencyAssessmentCard } from './CompetencyAssessmentCard';

interface AssessmentCompleteStateProps {
  /**
   * The assessment from session.assessment
   */
  assessment: Assessment;

  /**
   * Callback fired when PDF export button is clicked (stubbed for future implementation)
   */
  onExportPdf?: () => void;

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
 * AssessmentCompleteState component - displays a completed assessment in read-only mode.
 * Shows recommendation badge, confidence, reasoning, per-competency assessments, and PDF export button.
 * No approval actions available in this state.
 *
 * @param assessment - The assessment from session.assessment
 * @param onExportPdf - Callback fired when PDF export button is clicked (optional)
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The AssessmentCompleteState component
 */
export const AssessmentCompleteState = ({
  assessment,
  onExportPdf,
  testId = 'assessment-complete-state',
}: AssessmentCompleteStateProps): JSX.Element => {
  return (
    <div data-testid={testId} className="space-y-6 p-1">
      {/* Assessment Summary Card (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Final Assessment</CardTitle>
          <CardDescription>Review the final assessment and recommendation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessment.overrideReason && (
            <div className="space-y-4 border-l-2 border-amber-500 pl-4">
              <div className="text-base/tight font-bold text-amber-600 uppercase">Override</div>
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Recommendation
                </div>
                <div>
                  <RecommendationBadge
                    recommendation={assessment.recommendation}
                    testId="complete-recommendation-badge"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Reasoning</div>
                <p className="text-sm leading-relaxed">{assessment.overrideReason}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Recommendation</div>
              <div>
                <RecommendationBadge
                  recommendation={assessment.recommendation}
                  testId="complete-recommendation-badge"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Confidence</div>
              <p className="text-sm font-medium">{confidenceLabelMap[assessment.confidence]}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Reasoning</div>
            <p className="text-sm leading-relaxed">{assessment.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Competency Assessment Cards (Read-only) */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Competency Assessments</h3>
        {assessment.competencyAssessments.map((competency) => (
          <CompetencyAssessmentCard key={competency.competencyId} competency={competency} />
        ))}
      </div>

      {/* PDF Export Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onExportPdf} data-testid="export-pdf-button" disabled={!onExportPdf}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
};

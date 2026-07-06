import { JSX } from 'react';

import { CompetencyAssessment } from '@interview-forge/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/common/components/shadcn/card';

interface CompetencyAssessmentCardProps {
  /**
   * The competency assessment data
   */
  competency: CompetencyAssessment;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * CompetencyAssessmentCard component - displays per-competency assessment details.
 * Shows competency name, strengths, concerns, and any identified conflicts highlighted distinctly.
 *
 * @param competency - The competency assessment data
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The CompetencyAssessmentCard component
 */
export const CompetencyAssessmentCard = ({
  competency,
  testId = 'competency-assessment-card',
}: CompetencyAssessmentCardProps): JSX.Element => {
  const hasConflicts = competency.conflictsIdentified && competency.conflictsIdentified.length > 0;

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-lg">{competency.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <CardDescription className="text-foreground font-semibold">Strengths</CardDescription>
          <p className="mt-1 text-sm">{competency.strengths}</p>
        </div>

        <div>
          <CardDescription className="text-foreground font-semibold">Concerns</CardDescription>
          <p className="mt-1 text-sm">{competency.concerns}</p>
        </div>

        {hasConflicts && (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
            <CardDescription className="font-semibold text-yellow-900">Identified Conflicts</CardDescription>
            <ul className="mt-2 space-y-1">
              {competency.conflictsIdentified.map((conflict, idx) => (
                <li key={idx} className="text-sm text-yellow-800">
                  • {conflict}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

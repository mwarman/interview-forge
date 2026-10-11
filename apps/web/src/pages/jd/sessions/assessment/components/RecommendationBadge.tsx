import { JSX } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Recommendation } from '@interview-forge/shared';
import { Badge } from '@/common/components/shadcn/badge';

const recommendationVariants = cva('', {
  variants: {
    recommendation: {
      STRONG_HIRE: 'bg-green-100 text-green-800 border-green-300',
      HIRE: 'bg-teal-100 text-teal-800 border-teal-300',
      NO_HIRE: 'bg-orange-100 text-orange-800 border-orange-300',
      STRONG_NO_HIRE: 'bg-red-100 text-red-800 border-red-300',
    },
  },
  defaultVariants: {
    recommendation: 'HIRE',
  },
});

interface RecommendationBadgeProps extends VariantProps<typeof recommendationVariants> {
  /**
   * The recommendation value
   */
  recommendation: Recommendation;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * RecommendationBadge component - displays a recommendation with color coding.
 * Custom wrapper around shadcn Badge with variant styling.
 *
 * Color mapping:
 * - STRONG_HIRE: green
 * - HIRE: teal
 * - NO_HIRE: orange
 * - STRONG_NO_HIRE: red
 *
 * @param recommendation - The recommendation value
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The RecommendationBadge component
 */
export const RecommendationBadge = ({
  recommendation,
  testId = 'recommendation-badge',
}: RecommendationBadgeProps): JSX.Element => {
  const displayText = recommendation.split('_').join(' ');

  return (
    <Badge data-testid={testId} className={recommendationVariants({ recommendation })}>
      {displayText}
    </Badge>
  );
};

import { useCallback } from 'react';

import { Assessment } from '@interview-forge/shared';
import { downloadAssessmentPdf } from '@/common/utils/pdf-export';

interface UsePdfExportParams {
  /**
   * The assessment to export
   */
  assessment: Assessment;

  /**
   * The candidate's name
   */
  candidateName: string;

  /**
   * The job description title
   */
  jdTitle: string;
}

/**
 * Hook to handle PDF export for an assessment.
 * Generates a filename based on candidate name and date, then triggers PDF download.
 *
 * @param params - PDF export parameters
 * @returns Callback function to trigger PDF export
 *
 * @example
 * const handleExportPdf = usePdfExport({
 *   assessment,
 *   candidateName: 'John Doe',
 *   jdTitle: 'Senior Engineer'
 * });
 *
 * // Then call: handleExportPdf()
 */
export const usePdfExport = ({ assessment, candidateName, jdTitle }: UsePdfExportParams) => {
  const handleExportPdf = useCallback(() => {
    try {
      // Generate filename: sanitize candidate name and include date
      const sanitizedName = candidateName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const date = new Date(assessment.generatedAt);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const filename = `assessment-${sanitizedName}-${dateString}.pdf`;

      downloadAssessmentPdf(
        {
          assessment,
          candidateName,
          jdTitle,
          generatedAt: date,
        },
        filename,
      );
    } catch (error) {
      console.error('Failed to export assessment PDF:', error);
      throw error;
    }
  }, [assessment, candidateName, jdTitle]);

  return handleExportPdf;
};

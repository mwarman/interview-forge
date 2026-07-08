import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import { Assessment, CompetencyAssessment } from '@interview-forge/shared';

// Register fonts
// @ts-expect-error: pdfMake.vfs is not typed in the pdfmake package
pdfMake.vfs = pdfFonts;

interface GeneratePdfParams {
  assessment: Assessment;
  candidateName: string;
  jdTitle: string;
  generatedAt: Date;
}

/**
 * Generates a PDF document definition for the assessment.
 * Uses text styling only (bold, italics, spacing) - no colors for grayscale printability.
 *
 * @param params - PDF generation parameters
 * @returns pdfMake document definition
 */
export const generateAssessmentPdfDefinition = ({
  assessment,
  candidateName,
  jdTitle,
  generatedAt,
}: GeneratePdfParams): TDocumentDefinitions => {
  // Always use the generated recommendation in the Overall Recommendation section
  const generatedRecommendationLabel = assessment.recommendation
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Use the override recommendation label only if override exists
  const overrideRecommendationLabel = assessment.overrideRecommendation
    ? assessment.overrideRecommendation
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    : '';

  const confidenceLabel = assessment.confidence.charAt(0).toUpperCase() + assessment.confidence.slice(1).toLowerCase();

  const competencyContent = assessment.competencyAssessments.map((comp: CompetencyAssessment) => [
    {
      text: comp.name,
      style: 'competencyName',
      marginTop: 12,
    },
    {
      text: 'Strengths',
      style: 'competencySubheading',
      marginTop: 6,
    },
    {
      text: comp.strengths,
      style: 'bodyText',
      marginBottom: 8,
    },
    {
      text: 'Concerns',
      style: 'competencySubheading',
      marginTop: 6,
    },
    {
      text: comp.concerns,
      style: 'bodyText',
      marginBottom: 8,
    },
    ...(comp.conflictsIdentified.length > 0
      ? [
          {
            text: 'Conflicts Identified',
            style: 'competencySubheading',
            marginTop: 6,
          },
          {
            ul: comp.conflictsIdentified,
            style: 'bodyText',
            marginBottom: 8,
          },
        ]
      : []),
  ]);

  const overrideSection = assessment.overrideReasoning
    ? [
        {
          text: '\nOVERRIDE APPLIED',
          style: 'overrideHeading',
          marginTop: 10,
          marginBottom: 10,
        },
        {
          text: 'Override Recommendation',
          style: 'sectionSubheading',
        },
        {
          text: overrideRecommendationLabel,
          style: 'boldText',
          marginBottom: 8,
        },
        {
          text: 'Override Reasoning',
          style: 'sectionSubheading',
          marginTop: 10,
        },
        {
          text: assessment.overrideReasoning,
          style: 'bodyText',
        },
      ]
    : [];

  return {
    content: [
      // Header
      {
        text: 'Interview Forge Assessment Report',
        style: 'title',
        alignment: 'center',
        marginBottom: 20,
      },

      // Candidate & JD Info
      {
        columns: [
          {
            text: [
              { text: 'Candidate\n', style: 'labelBold' },
              { text: candidateName, style: 'bodyText' },
            ],
          },
          {
            text: [
              { text: 'Position\n', style: 'labelBold' },
              { text: jdTitle, style: 'bodyText' },
            ],
          },
          {
            text: [
              { text: 'Assessment Date\n', style: 'labelBold' },
              { text: generatedAt.toLocaleDateString(), style: 'bodyText' },
            ],
          },
        ],
        columnGap: 30,
        marginBottom: 20,
      },

      // Divider
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }],
        marginBottom: 20,
      },

      // Recommendation Section
      {
        text: 'Overall Recommendation',
        style: 'sectionHeading',
        marginTop: 12,
        marginBottom: 10,
      },
      {
        columns: [
          {
            text: [
              { text: 'Recommendation\n', style: 'sectionSubheading' },
              { text: generatedRecommendationLabel, style: 'boldText' },
            ],
          },
          {
            text: [
              { text: 'Confidence\n', style: 'sectionSubheading' },
              { text: confidenceLabel, style: 'bodyText' },
            ],
          },
        ],
        columnGap: 40,
        marginBottom: 15,
      },

      // Reasoning
      {
        text: 'Assessment Reasoning',
        style: 'sectionSubheading',
        marginTop: 12,
        marginBottom: 6,
      },
      {
        text: assessment.reasoning,
        style: 'bodyText',
        marginBottom: 6,
      },

      // Override Section (if applicable)
      ...(assessment.overrideReasoning ? overrideSection : []),

      // Divider
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }],
        marginTop: 20,
        marginBottom: 20,
      },

      // Competency Assessments
      {
        text: 'Competency Assessment Details',
        style: 'sectionHeading',
        marginBottom: 12,
      },
      ...competencyContent,
    ],

    styles: {
      title: {
        fontSize: 24,
        bold: true,
        lineHeight: 1.4,
      },
      sectionHeading: {
        fontSize: 14,
        bold: true,
        lineHeight: 1.3,
      },
      sectionSubheading: {
        fontSize: 11,
        bold: true,
        lineHeight: 1.2,
      },
      competencyName: {
        fontSize: 12,
        bold: true,
        lineHeight: 1.2,
      },
      competencySubheading: {
        fontSize: 10,
        bold: true,
        italics: true,
        lineHeight: 1.2,
      },
      labelBold: {
        fontSize: 10,
        bold: true,
        lineHeight: 1.3,
      },
      boldText: {
        fontSize: 11,
        bold: true,
        lineHeight: 1.3,
      },
      bodyText: {
        fontSize: 10,
        lineHeight: 1.4,
      },
      overrideHeading: {
        fontSize: 12,
        bold: true,
        italics: true,
        lineHeight: 1.3,
      },
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },

    pageMargins: [40, 40, 40, 40],
  };
};

/**
 * Generates and downloads an assessment PDF.
 * Creates pdfMake document, generates PDF, and triggers browser download.
 *
 * @param params - PDF generation parameters
 * @param filename - Optional filename (defaults to assessment-report.pdf)
 */
export const downloadAssessmentPdf = (params: GeneratePdfParams, filename = 'assessment-report.pdf'): void => {
  const docDefinition = generateAssessmentPdfDefinition(params);
  pdfMake.createPdf(docDefinition).download(filename);
};

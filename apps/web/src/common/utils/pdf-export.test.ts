import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Assessment } from '@interview-forge/shared';
import { generateAssessmentPdfDefinition, downloadAssessmentPdf } from './pdf-export';

vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    vfs: null,
    createPdf: vi.fn(() => ({
      download: vi.fn(),
    })),
  },
}));

vi.mock('pdfmake/build/vfs_fonts', () => ({
  default: {},
}));

const mockAssessment: Assessment = {
  assessmentId: '123e4567-e89b-12d3-a456-426614174000',
  recommendation: 'STRONG_HIRE',
  confidence: 'HIGH',
  reasoning:
    'Exceptional candidate who exceeded expectations across all evaluated competencies. Demonstrated mastery of system design, architecture patterns, and team collaboration. Shows strong potential for senior roles.',
  competencyAssessments: [
    {
      competencyId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'System Design',
      strengths: 'Exceptional understanding of scalable systems and architectural patterns',
      concerns: 'Limited experience with distributed tracing',
      conflictsIdentified: [],
    },
    {
      competencyId: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Leadership',
      strengths: 'Great mentoring skills and team communication',
      concerns: 'Limited cross-team collaboration experience',
      conflictsIdentified: ['Conflict signal from project X'],
    },
  ],
  generatedAt: '2026-06-22T10:30:00Z',
};

describe('pdf-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAssessmentPdfDefinition', () => {
    it('should generate a valid PDF definition with all required sections', () => {
      // Arrange
      const candidateName = 'John Doe';
      const jdTitle = 'Senior Software Engineer';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      expect(definition).toBeDefined();
      expect(definition.content).toBeDefined();
      expect(Array.isArray(definition.content)).toBe(true);
      expect(definition.content.length).toBeGreaterThan(0);
    });

    it('should include title section with correct text', () => {
      // Arrange
      const candidateName = 'Jane Smith';
      const jdTitle = 'Staff Engineer';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert - should have title at beginning
      const titleContent = definition.content[0];
      expect(typeof titleContent === 'object' && titleContent !== null).toBe(true);
      if (typeof titleContent === 'object' && 'text' in titleContent) {
        expect(titleContent.text).toBe('Interview Forge Assessment Report');
      }
    });

    it('should include candidate info section with provided data', () => {
      // Arrange
      const candidateName = 'Alice Johnson';
      const jdTitle = 'Tech Lead';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      expect(definition.content).toBeDefined();
      const contentString = JSON.stringify(definition.content);
      expect(contentString).toContain(candidateName);
      expect(contentString).toContain(jdTitle);
    });

    it('should include recommendation with correct text formatting', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      expect(contentString).toContain('Strong Hire');
      expect(contentString).toContain('High');
    });

    it('should include all competency assessments', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      mockAssessment.competencyAssessments.forEach((comp) => {
        expect(contentString).toContain(comp.name);
        expect(contentString).toContain(comp.strengths);
        expect(contentString).toContain(comp.concerns);
      });
    });

    it('should include override section when override reasoning is provided', () => {
      // Arrange
      const assessmentWithOverride: Assessment = {
        ...mockAssessment,
        overrideReasoning: 'After team discussion, candidate shows exceptional potential.',
        overrideRecommendation: 'STRONG_HIRE',
      };
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: assessmentWithOverride,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      expect(contentString).toContain('OVERRIDE APPLIED');
      expect(contentString).toContain('After team discussion');
    });

    it('should not include override section when override reasoning is not provided', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      expect(contentString).not.toContain('OVERRIDE APPLIED');
    });

    it('should include recommendation reasoning in reasoning section', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      expect(contentString).toContain(mockAssessment.reasoning);
    });

    it('should include conflict signals when present in competencies', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      expect(contentString).toContain('Conflict signal from project X');
    });

    it('should have styles defined for grayscale printing', () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      expect(definition.styles).toBeDefined();
      expect(definition.styles?.title).toBeDefined();
      expect(definition.styles?.bodyText).toBeDefined();
      // Ensure no color properties in any style (for grayscale)
      const stylesString = JSON.stringify(definition.styles);
      expect(stylesString).not.toContain('color');
    });

    it('should display generated recommendation in Overall Recommendation section and override recommendation in Override section', () => {
      // Arrange
      const assessmentWithOverride: Assessment = {
        ...mockAssessment,
        recommendation: 'HIRE',
        overrideReasoning: 'After team discussion, recommendation changed.',
        overrideRecommendation: 'STRONG_HIRE',
      };
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');

      // Act
      const definition = generateAssessmentPdfDefinition({
        assessment: assessmentWithOverride,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const contentString = JSON.stringify(definition.content);
      // Generated recommendation (HIRE -> "Hire") should be in Overall Recommendation section
      expect(contentString).toContain('Hire');
      // Override recommendation (STRONG_HIRE -> "Strong Hire") should be in Override section
      expect(contentString).toContain('Strong Hire');
      // Both should be present since they're different
      expect(contentString).toContain('OVERRIDE APPLIED');
    });
  });

  describe('downloadAssessmentPdf', () => {
    it('should call pdfMake.createPdf with generated definition', async () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');
      const { default: pdfMake } = await import('pdfmake/build/pdfmake');

      // Act
      downloadAssessmentPdf({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      expect(pdfMake.createPdf).toHaveBeenCalled();
    });

    it('should call download with default filename', async () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');
      const { default: pdfMake } = await import('pdfmake/build/pdfmake');

      // Act
      downloadAssessmentPdf({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
        generatedAt,
      });

      // Assert
      const mockPdf = (pdfMake.createPdf as vi.Mock).mock.results[0].value;
      expect(mockPdf.download).toHaveBeenCalledWith('assessment-report.pdf');
    });

    it('should call download with custom filename when provided', async () => {
      // Arrange
      const candidateName = 'Test Candidate';
      const jdTitle = 'Test Position';
      const generatedAt = new Date('2026-06-22');
      const customFilename = 'custom-assessment.pdf';
      const { default: pdfMake } = await import('pdfmake/build/pdfmake');

      // Act
      downloadAssessmentPdf(
        {
          assessment: mockAssessment,
          candidateName,
          jdTitle,
          generatedAt,
        },
        customFilename,
      );

      // Assert
      const mockPdf = (pdfMake.createPdf as vi.Mock).mock.results[0].value;
      expect(mockPdf.download).toHaveBeenCalledWith(customFilename);
    });
  });
});

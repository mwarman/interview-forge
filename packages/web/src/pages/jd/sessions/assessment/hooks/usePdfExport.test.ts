import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Assessment } from '@interview-forge/shared';
import { renderHookWithAllProviders } from '@/test/test-utils';
import { usePdfExport } from './usePdfExport';

vi.mock('@/common/utils/pdf-export', () => ({
  downloadAssessmentPdf: vi.fn(),
}));

const mockAssessment: Assessment = {
  assessmentId: '123e4567-e89b-12d3-a456-426614174000',
  recommendation: 'STRONG_HIRE',
  confidence: 'HIGH',
  reasoning:
    'Exceptional candidate with strong technical skills and leadership potential. Demonstrated mastery across all core competencies.',
  competencyAssessments: [
    {
      competencyId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'System Design',
      strengths: 'Excellent understanding of scalable architecture',
      concerns: 'Limited cloud experience',
      conflictsIdentified: [],
    },
  ],
  generatedAt: '2026-06-22T10:30:00Z',
};

describe('usePdfExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a callback function', () => {
    // Arrange & Act
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: 'John Doe',
        jdTitle: 'Senior Engineer',
      }),
    );

    // Assert
    expect(typeof result.current).toBe('function');
  });

  it('should call downloadAssessmentPdf when callback is invoked', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: 'John Doe',
        jdTitle: 'Senior Engineer',
      }),
    );

    // Act
    result.current();

    // Assert
    expect(downloadAssessmentPdf).toHaveBeenCalledOnce();
  });

  it('should generate filename with sanitized candidate name and date', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: 'John Doe',
        jdTitle: 'Senior Engineer',
      }),
    );

    // Act
    result.current();

    // Assert
    const callArgs = (downloadAssessmentPdf as vi.Mock).mock.calls[0];
    expect(callArgs[1]).toContain('assessment-john-doe');
    expect(callArgs[1]).toContain('2026-06-22');
    expect(callArgs[1]).toMatch(/\.pdf$/);
  });

  it('should handle special characters in candidate name', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: "O'Brien-Smith's Test@123",
        jdTitle: 'Senior Engineer',
      }),
    );

    // Act
    result.current();

    // Assert
    const callArgs = (downloadAssessmentPdf as vi.Mock).mock.calls[0];
    // Should sanitize special characters
    expect(callArgs[1]).toMatch(/assessment-[a-z0-9-]+\.pdf/);
  });

  it('should pass assessment data to downloadAssessmentPdf', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const candidateName = 'Jane Smith';
    const jdTitle = 'Tech Lead';
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName,
        jdTitle,
      }),
    );

    // Act
    result.current();

    // Assert
    const callArgs = (downloadAssessmentPdf as vi.Mock).mock.calls[0][0];
    expect(callArgs.assessment).toEqual(mockAssessment);
    expect(callArgs.candidateName).toBe(candidateName);
    expect(callArgs.jdTitle).toBe(jdTitle);
  });

  it('should pass correct date object to downloadAssessmentPdf', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: 'John Doe',
        jdTitle: 'Senior Engineer',
      }),
    );

    // Act
    result.current();

    // Assert
    const callArgs = (downloadAssessmentPdf as vi.Mock).mock.calls[0][0];
    expect(callArgs.generatedAt instanceof Date).toBe(true);
    expect(callArgs.generatedAt.toISOString()).toContain('2026-06-22');
  });

  it('should handle errors gracefully and log to console', async () => {
    // Arrange
    const { downloadAssessmentPdf } = await import('@/common/utils/pdf-export');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('PDF generation failed');
    (downloadAssessmentPdf as vi.Mock).mockImplementation(() => {
      throw testError;
    });

    const { result } = renderHookWithAllProviders(() =>
      usePdfExport({
        assessment: mockAssessment,
        candidateName: 'John Doe',
        jdTitle: 'Senior Engineer',
      }),
    );

    // Act & Assert
    expect(() => {
      result.current();
    }).toThrow('PDF generation failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to export assessment PDF'), testError);

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Assessment } from '@interview-forge/shared';
import { AssessmentCompleteState } from './AssessmentCompleteState';

describe('AssessmentCompleteState', () => {
  const mockAssessment: Assessment = {
    assessmentId: '123e4567-e89b-12d3-a456-426614174000',
    recommendation: 'STRONG_HIRE',
    confidence: 'HIGH',
    reasoning:
      'Exceptional candidate who exceeded expectations across all evaluated competencies. Demonstrated mastery of system design.',
    competencyAssessments: [
      {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: 'Exceptional understanding',
        concerns: 'None',
        conflictsIdentified: [],
      },
    ],
    generatedAt: '2026-06-22T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render final assessment card', () => {
    // Arrange &Act
    render(<AssessmentCompleteState assessment={mockAssessment} />);

    // Assert
    expect(screen.getByText('Final Assessment')).toBeInTheDocument();
    expect(screen.getByTestId('complete-recommendation-badge')).toHaveTextContent('STRONG HIRE');
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('should render reasoning text', () => {
    // Arrange & Act
    render(<AssessmentCompleteState assessment={mockAssessment} />);

    // Assert
    expect(screen.getByText(/Exceptional candidate who exceeded expectations/)).toBeInTheDocument();
  });

  it('should render competency assessments', () => {
    // Arrange & Act
    render(<AssessmentCompleteState assessment={mockAssessment} />);

    // Assert
    expect(screen.getByText('Competency Assessments')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
  });

  it('should render PDF export button', () => {
    // Arrange
    const onExportPdf = vi.fn();

    // Act
    render(<AssessmentCompleteState assessment={mockAssessment} onExportPdf={onExportPdf} />);

    // Assert
    expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-pdf-button')).toHaveTextContent('Export PDF');
  });

  it('should call onExportPdf when PDF button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onExportPdf = vi.fn();

    render(<AssessmentCompleteState assessment={mockAssessment} onExportPdf={onExportPdf} />);

    // Act
    await user.click(screen.getByTestId('export-pdf-button'));

    // Assert
    expect(onExportPdf).toHaveBeenCalledOnce();
  });

  it('should disable PDF button when onExportPdf is not provided', () => {
    // Arrange & Act
    render(<AssessmentCompleteState assessment={mockAssessment} />);

    // Assert
    expect(screen.getByTestId('export-pdf-button')).toBeDisabled();
  });

  it('should display override section when override reasoning is provided', () => {
    // Arrange
    const assessmentWithOverride: Assessment = {
      ...mockAssessment,
      overrideReasoning: 'After team discussion, candidate shows exceptional potential.',
      overrideRecommendation: 'STRONG_HIRE',
    };

    // Act
    render(<AssessmentCompleteState assessment={assessmentWithOverride} />);

    // Assert
    expect(screen.getByText('Override')).toBeInTheDocument();
    expect(screen.getByText('After team discussion, candidate shows exceptional potential.')).toBeInTheDocument();
    expect(screen.getByTestId('complete-override-recommendation-badge')).toHaveTextContent('STRONG HIRE');
  });

  it('should display original recommendation in override section when override recommendation is not provided', () => {
    // Arrange
    const assessmentWithOverrideReasoningOnly: Assessment = {
      ...mockAssessment,
      recommendation: 'HIRE',
      overrideReasoning: 'Reconsidered after additional review.',
    };

    // Act
    render(<AssessmentCompleteState assessment={assessmentWithOverrideReasoningOnly} />);

    // Assert
    expect(screen.getByText('Override')).toBeInTheDocument();
    expect(screen.getByText('Reconsidered after additional review.')).toBeInTheDocument();
    expect(screen.getByTestId('complete-override-recommendation-badge')).toHaveTextContent('HIRE');
  });

  it('should not display override section when override reasoning is not provided', () => {
    // Arrange & Act
    render(<AssessmentCompleteState assessment={mockAssessment} />);

    // Assert
    expect(screen.queryByText('Override')).not.toBeInTheDocument();
  });
});

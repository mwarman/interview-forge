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
});

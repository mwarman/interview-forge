import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Assessment } from '@interview-forge/shared';
import { AssessmentReadyState } from './AssessmentReadyState';

describe('AssessmentReadyState', () => {
  const mockAssessment: Assessment = {
    assessmentId: '123e4567-e89b-12d3-a456-426614174000',
    recommendation: 'HIRE',
    confidence: 'HIGH',
    reasoning:
      'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive.',
    competencyAssessments: [
      {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: 'Excellent understanding',
        concerns: 'Limited experience',
        conflictsIdentified: [],
      },
    ],
    generatedAt: '2026-06-22T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render assessment summary with recommendation and confidence', () => {
    // Arrange
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    // Act
    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Assert
    expect(screen.getByTestId('assessment-ready-state')).toBeInTheDocument();
    expect(screen.getByText('Assessment Summary')).toBeInTheDocument();
    expect(screen.getByText('Recommendation')).toBeInTheDocument();
    expect(screen.getByTestId('summary-recommendation-badge')).toHaveTextContent('HIRE');
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('should render reasoning text', () => {
    // Arrange
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    // Act
    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Assert
    expect(screen.getByText(/The candidate demonstrated strong technical fundamentals/)).toBeInTheDocument();
  });

  it('should render competency assessments section', () => {
    // Arrange
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    // Act
    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Assert
    expect(screen.getByText('Competency Assessments')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
  });

  it('should call onApprove when approve button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Act
    await user.click(screen.getByTestId('approve-assessment-button'));

    // Assert
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('should open override dialog when approve with override button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Act
    const overrideButton = screen.getByTestId('approve-with-override-button');
    await user.click(overrideButton);

    // Assert
    expect(screen.getByTestId('approve-with-override-dialog')).toBeInTheDocument();
  });

  it('should disable buttons when isApproving is true', () => {
    // Arrange
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    // Act
    render(
      <AssessmentReadyState
        assessment={mockAssessment}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
        isApproving={true}
      />,
    );

    // Assert
    expect(screen.getByTestId('approve-assessment-button')).toBeDisabled();
    expect(screen.getByTestId('approve-with-override-button')).toBeDisabled();
    expect(screen.getByTestId('approve-assessment-button')).toHaveTextContent('Approving…');
  });

  it('should render multiple competency assessments', () => {
    // Arrange
    const assessmentWithMultiple: Assessment = {
      ...mockAssessment,
      competencyAssessments: [
        ...mockAssessment.competencyAssessments,
        {
          competencyId: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Communication',
          strengths: 'Clear articulation',
          concerns: 'None',
          conflictsIdentified: [],
        },
      ],
    };
    const onApprove = vi.fn();
    const onApproveWithOverride = vi.fn();

    // Act
    render(
      <AssessmentReadyState
        assessment={assessmentWithMultiple}
        onApprove={onApprove}
        onApproveWithOverride={onApproveWithOverride}
      />,
    );

    // Assert
    expect(screen.getByText('System Design')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });
});

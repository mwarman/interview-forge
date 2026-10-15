import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { InterviewPlan } from '@interview-forge/shared';
import { PlanReadyState } from './PlanReadyState';

const mockPlan: InterviewPlan = {
  planId: 'plan-123',
  competencies: [
    {
      competencyId: 'comp-1',
      name: 'Communication',
      description: 'Ability to communicate effectively',
      evaluationCriteria: 'Clarity and engagement',
      questions: [
        {
          questionId: 'q-1',
          text: 'Describe a time you communicated complex information',
          type: 'BEHAVIORAL',
          followUpPrompt: 'What was the outcome?',
        },
      ],
    },
  ],
  generatedAt: '2026-06-01T12:00:00Z',
};

describe('PlanReadyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render plan heading and description', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Assert
    expect(screen.getByText('Review the Plan')).toBeInTheDocument();
    expect(screen.getByText(/Changes are saved when you approve/)).toBeInTheDocument();
  });

  it('should render competency name in accordion trigger', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Assert
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('should render competency fields with initial values', async () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Expand accordion to see fields
    const trigger = screen.getByText('Communication');
    await userEvent.click(trigger);

    // Assert
    const descInput = screen.getByDisplayValue('Ability to communicate effectively');
    expect(descInput).toBeInTheDocument();
  });

  it('should enable approve button when plan is valid', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Assert
    expect(screen.getByTestId('approve-plan-button')).not.toBeDisabled();
  });

  it('should call onApprovePlan with edited plan on approve', async () => {
    // Arrange
    const user = userEvent.setup();
    const onApprovePlan = vi.fn();

    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={onApprovePlan} />);

    // Act
    const approveButton = screen.getByTestId('approve-plan-button');
    await user.click(approveButton);

    // Assert
    expect(onApprovePlan).toHaveBeenCalledOnce();
    const callArg = onApprovePlan.mock.calls[0][0];
    expect(callArg.competencies).toEqual(mockPlan.competencies);
  });

  it('should disable approve button when isApproving is true', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} isApproving={true} />);

    // Assert
    const button = screen.getByTestId('approve-plan-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Approving…');
  });

  it('should render add competency button', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Assert
    expect(screen.getByTestId('add-competency-button')).toBeInTheDocument();
  });

  it('should allow editing competency name', async () => {
    // Arrange
    const user = userEvent.setup();

    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Expand accordion
    await user.click(screen.getByText('Communication'));

    // Act
    const nameInput = screen.getByTestId('competency-name-input-0') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Leadership');

    // Assert
    expect(nameInput.value).toBe('Leadership');
  });

  it('should show remove competency button', async () => {
    // Arrange
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} />);

    // Act
    await userEvent.click(screen.getByText('Communication'));

    // Assert
    expect(screen.getByTestId('remove-competency-button-0')).toBeInTheDocument();
  });

  it('should accept custom testId', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanReadyState plan={mockPlan} onApprovePlan={vi.fn()} testId="custom-ready" />);

    // Assert
    expect(screen.getByTestId('custom-ready')).toBeInTheDocument();
  });
});

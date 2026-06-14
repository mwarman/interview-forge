import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { renderWithAllProviders } from '@/test/test-utils';
import { InterviewPlanSchema } from '@interview-forge/shared';
import { QuestionsFormFields } from './QuestionsFormFields';
import { PlanFormValues } from './PlanReadyState';

/**
 * Test wrapper component that provides react-hook-form context for QuestionsFormFields
 */
const QuestionsFormFieldsWrapper = ({ competencyIndex = 0 }: { competencyIndex?: number }) => {
  const { control } = useForm<PlanFormValues>({
    resolver: zodResolver(InterviewPlanSchema.pick({ competencies: true })),
    defaultValues: {
      competencies: [
        {
          competencyId: 'comp-1',
          name: 'Communication',
          description: 'Test competency',
          evaluationCriteria: 'Test criteria',
          questions: [
            {
              questionId: 'q-1',
              text: 'Describe a time you communicated',
              type: 'BEHAVIORAL',
              followUpPrompt: 'What was the outcome?',
            },
            {
              questionId: 'q-2',
              text: 'How would you handle a difficult conversation?',
              type: 'SITUATIONAL',
              followUpPrompt: '',
            },
          ],
        },
      ],
    },
  });

  return <QuestionsFormFields control={control} competencyIndex={competencyIndex} />;
};

/**
 * Test wrapper for a single question
 */
const SingleQuestionWrapper = () => {
  const { control } = useForm<PlanFormValues>({
    resolver: zodResolver(InterviewPlanSchema.pick({ competencies: true })),
    defaultValues: {
      competencies: [
        {
          competencyId: 'comp-1',
          name: 'Communication',
          description: 'Test competency',
          evaluationCriteria: 'Test criteria',
          questions: [
            {
              questionId: 'q-1',
              text: 'Sample question',
              type: 'BEHAVIORAL',
              followUpPrompt: 'Sample prompt',
            },
          ],
        },
      ],
    },
  });

  return <QuestionsFormFields control={control} competencyIndex={0} />;
};

describe('QuestionsFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render interview questions card', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      expect(screen.getByText('Interview Questions')).toBeInTheDocument();
      expect(
        screen.getByText('Define the interview questions for this competency. At least one question is required.'),
      ).toBeInTheDocument();
    });

    it('should render multiple question cards with correct numbering', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('should render question card with testid', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      expect(screen.getByTestId('question-card-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-0-1')).toBeInTheDocument();
    });

    it('should render question text input with initial value', () => {
      // Arrange & Act
      renderWithAllProviders(<SingleQuestionWrapper />);

      // Assert
      const input = screen.getByTestId('question-text-input-0-0') as HTMLTextAreaElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('Sample question');
    });

    it('should render question type select with initial value', () => {
      // Arrange & Act
      renderWithAllProviders(<SingleQuestionWrapper />);

      // Assert
      const select = screen.getByTestId('question-type-select-0-0') as HTMLButtonElement;
      expect(select).toBeInTheDocument();
      // The select trigger displays the current value
      expect(select).toHaveTextContent('Behavioral');
    });

    it('should render follow-up prompt textarea with initial value', () => {
      // Arrange & Act
      renderWithAllProviders(<SingleQuestionWrapper />);

      // Assert
      const input = screen.getByTestId('question-followup-input-0-0') as HTMLTextAreaElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('Sample prompt');
    });

    it('should render delete button for each question', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      expect(screen.getByTestId('remove-question-button-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('remove-question-button-0-1')).toBeInTheDocument();
    });
  });

  describe('Question Text Editing', () => {
    it('should allow editing question text', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const input = screen.getByTestId('question-text-input-0-0') as HTMLTextAreaElement;

      // Act
      await user.clear(input);
      await user.type(input, 'Updated question text');

      // Assert
      expect(input.value).toBe('Updated question text');
    });

    it('should update question text with multiline input', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const input = screen.getByTestId('question-text-input-0-0') as HTMLTextAreaElement;

      // Act
      await user.clear(input);
      await user.type(input, 'Line 1\nLine 2\nLine 3');

      // Assert
      expect(input.value).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Question Type Selection', () => {
    it('should render type select with correct initial value', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      const typeSelect1 = screen.getByTestId('question-type-select-0-0');
      const typeSelect2 = screen.getByTestId('question-type-select-0-1');

      expect(typeSelect1).toHaveTextContent('Behavioral');
      expect(typeSelect2).toHaveTextContent('Situational');
    });

    it('should render type select for each question', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      expect(screen.getByTestId('question-type-select-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('question-type-select-0-1')).toBeInTheDocument();
    });
  });

  describe('Follow-up Prompt Editing', () => {
    it('should allow editing follow-up prompt', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const input = screen.getByTestId('question-followup-input-0-0') as HTMLTextAreaElement;

      // Act
      await user.clear(input);
      await user.type(input, 'Updated follow-up prompt');

      // Assert
      expect(input.value).toBe('Updated follow-up prompt');
    });

    it('should allow clearing follow-up prompt', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const input = screen.getByTestId('question-followup-input-0-0') as HTMLTextAreaElement;

      // Act
      await user.clear(input);

      // Assert
      expect(input.value).toBe('');
    });

    it('should allow empty follow-up prompt for existing question', () => {
      // Arrange & Act
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      // Assert
      const input = screen.getByTestId('question-followup-input-0-1') as HTMLTextAreaElement;
      expect(input.value).toBe('');
    });
  });

  describe('Question Deletion', () => {
    it('should open remove confirm dialog when delete button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const deleteButton = screen.getByTestId('remove-question-button-0-0');

      // Act
      await user.click(deleteButton);

      // Assert
      const dialog = await screen.findByTestId('remove-confirm-dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should display question text in remove confirmation dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const deleteButton = screen.getByTestId('remove-question-button-0-0');

      // Act
      await user.click(deleteButton);

      // Assert
      const description = await screen.findByText(/This question will be permanently removed from the plan/);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Sample question');
    });

    it('should close dialog without removing when cancel is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const deleteButton = screen.getByTestId('remove-question-button-0-0');

      // Act
      await user.click(deleteButton);
      const cancelButton = await screen.findByTestId('confirm-cancel-button');
      await user.click(cancelButton);

      // Assert - dialog should close
      await new Promise((resolve) => setTimeout(resolve, 50)); // Allow animation to complete
      expect(screen.queryByTestId('remove-confirm-dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('question-card-0-0')).toBeInTheDocument();
    });

    it('should have confirm remove button in dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<SingleQuestionWrapper />);

      const deleteButton = screen.getByTestId('remove-question-button-0-0');

      // Act
      await user.click(deleteButton);

      // Assert - dialog with confirm button should be present
      const confirmButton = await screen.findByTestId('confirm-remove-button');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveTextContent('Remove Question');
    });
  });

  describe('Multiple Questions', () => {
    it('should maintain independence between multiple question edits', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      const input1 = screen.getByTestId('question-text-input-0-0') as HTMLTextAreaElement;
      const input2 = screen.getByTestId('question-text-input-0-1') as HTMLTextAreaElement;

      // Act
      await user.clear(input1);
      await user.type(input1, 'Updated question 1');

      // Assert - first question changed, second unchanged
      expect(input1.value).toBe('Updated question 1');
      expect(input2.value).toBe('How would you handle a difficult conversation?');
    });

    it('should display correct question name for second delete action', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<QuestionsFormFieldsWrapper />);

      const deleteButton2 = screen.getByTestId('remove-question-button-0-1');

      // Act
      await user.click(deleteButton2);

      // Assert
      const description = await screen.findByText(/This question will be permanently removed from the plan/);
      expect(description).toHaveTextContent('How would you handle a difficult conversation');
    });
  });

  describe('Field Labels and Accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      // Arrange & Act
      renderWithAllProviders(<SingleQuestionWrapper />);

      // Assert
      expect(screen.getByLabelText('Question')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow-up Prompt (Optional)')).toBeInTheDocument();
    });

    it('should have proper aria-invalid when rendering', () => {
      // Arrange & Act
      renderWithAllProviders(<SingleQuestionWrapper />);

      // Assert
      const questionInput = screen.getByTestId('question-text-input-0-0');
      const typeSelect = screen.getByTestId('question-type-select-0-0');
      const followUpInput = screen.getByTestId('question-followup-input-0-0');

      expect(questionInput).toHaveAttribute('aria-invalid', 'false');
      expect(typeSelect).toHaveAttribute('aria-invalid', 'false');
      expect(followUpInput).toHaveAttribute('aria-invalid', 'false');
    });
  });
});

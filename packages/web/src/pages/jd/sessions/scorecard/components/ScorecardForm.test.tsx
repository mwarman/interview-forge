import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { InterviewPlan, CompetencyNotes } from '@interview-forge/shared';

import { ScorecardForm } from './ScorecardForm';

const mockPlan: InterviewPlan = {
  planId: 'plan-123',
  competencies: [
    {
      competencyId: 'comp-1',
      name: 'Leadership',
      description: 'Ability to lead and inspire teams',
      evaluationCriteria: 'Clear vision, delegation, motivation',
      questions: [
        {
          questionId: 'q-1',
          text: 'Tell me about a time you led a team to success',
          type: 'BEHAVIORAL',
        },
        {
          questionId: 'q-2',
          text: 'How do you handle conflict in a team?',
          type: 'SITUATIONAL',
        },
      ],
    },
    {
      competencyId: 'comp-2',
      name: 'Technical Skills',
      description: 'Technical problem-solving abilities',
      evaluationCriteria: 'Depth of knowledge, architecture thinking',
      questions: [
        {
          questionId: 'q-3',
          text: 'Design a system to scale to 1M users',
          type: 'TECHNICAL',
        },
      ],
    },
  ],
  generatedAt: '2026-06-01T12:00:00Z',
};

const mockCompetencyScores: CompetencyNotes[] = [
  {
    competencyId: 'comp-1',
    overallNotes: '',
    questionRatings: [
      { questionId: 'q-1', rating: undefined, notes: '' },
      { questionId: 'q-2', rating: undefined, notes: '' },
    ],
  },
  {
    competencyId: 'comp-2',
    overallNotes: '',
    questionRatings: [{ questionId: 'q-3', rating: undefined, notes: '' }],
  },
];

describe('ScorecardForm', () => {
  it('should render all competency sections', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
  });

  it('should render overall notes textarea for each competency', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert
    expect(screen.getByTestId('overall-notes-textarea-comp-1')).toBeInTheDocument();
    expect(screen.getByTestId('overall-notes-textarea-comp-2')).toBeInTheDocument();
  });

  it('should render all questions with text and type badge', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert
    expect(screen.getByText('Tell me about a time you led a team to success')).toBeInTheDocument();
    expect(screen.getByText('How do you handle conflict in a team?')).toBeInTheDocument();
    expect(screen.getByText('Design a system to scale to 1M users')).toBeInTheDocument();

    expect(screen.getByTestId('question-type-badge-q-1')).toHaveTextContent('BEHAVIORAL');
    expect(screen.getByTestId('question-type-badge-q-2')).toHaveTextContent('SITUATIONAL');
    expect(screen.getByTestId('question-type-badge-q-3')).toHaveTextContent('TECHNICAL');
  });

  it('should render Likert rating control for each question', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert - check that rating section labels are rendered
    expect(screen.getByTestId('rating-control-q-1')).toBeInTheDocument();
    expect(screen.getByTestId('rating-control-q-2')).toBeInTheDocument();
    expect(screen.getByTestId('rating-control-q-3')).toBeInTheDocument();
  });

  it('should render notes textarea for each question', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert
    expect(screen.getByTestId('question-notes-textarea-q-1')).toBeInTheDocument();
    expect(screen.getByTestId('question-notes-textarea-q-2')).toBeInTheDocument();
    expect(screen.getByTestId('question-notes-textarea-q-3')).toBeInTheDocument();
  });

  it('should call onCompetencyScoresChange when overall notes change', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
    );

    // Act
    const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
    await user.clear(textarea);
    await user.type(textarea, 'Great');

    // Assert
    expect(onChange).toHaveBeenCalled();
  });

  it('should call onCompetencyScoresChange when rating is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
    );

    // Act - find and click a rating option
    const ratingOptions = screen.getAllByTestId(/rating-option-/);
    if (ratingOptions.length > 0) {
      await user.click(ratingOptions[0]);
    }

    // Assert
    expect(onChange).toHaveBeenCalled();
  });

  it('should call onCompetencyScoresChange when question notes change', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
    );

    // Act
    const textarea = screen.getByTestId('question-notes-textarea-q-1');
    await user.clear(textarea);
    await user.type(textarea, 'Good');

    // Assert
    expect(onChange).toHaveBeenCalled();
  });

  it('should display character counts for textareas', () => {
    // Arrange & Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert - check for character count displays
    expect(screen.getAllByText('0/2000 characters')).toBeDefined();
    expect(screen.getAllByText('0/1000 characters')).toBeDefined();
  });

  it('should display current values when scores are provided', () => {
    // Arrange
    const filledScores: CompetencyNotes[] = [
      {
        competencyId: 'comp-1',
        overallNotes: 'Strong leader',
        questionRatings: [
          { questionId: 'q-1', rating: 4, notes: 'Excellent team lead' },
          { questionId: 'q-2', rating: 5, notes: 'Great conflict resolution' },
        ],
      },
      {
        competencyId: 'comp-2',
        overallNotes: '',
        questionRatings: [{ questionId: 'q-3', rating: 3, notes: '' }],
      },
    ];

    // Act
    renderWithAllProviders(
      <ScorecardForm plan={mockPlan} competencyScores={filledScores} onCompetencyScoresChange={vi.fn()} />,
    );

    // Assert
    expect(screen.getByTestId('overall-notes-textarea-comp-1')).toHaveValue('Strong leader');
    expect(screen.getByTestId('question-notes-textarea-q-1')).toHaveValue('Excellent team lead');
  });

  describe('React Hook Form Integration', () => {
    it('should sync form changes to parent via watch hook', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'Test notes');

      // Assert - onChange should be called multiple times as user types
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).toEqual(expect.arrayContaining([expect.objectContaining({ competencyId: 'comp-1' })]));
    });

    it('should maintain form values across multiple field changes', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act - update multiple fields
      const textarea1 = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea1, 'Competency notes');

      // Assert - verify the latest state has the competency notes
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      const comp1Scores = lastCall.find((c: CompetencyNotes) => c.competencyId === 'comp-1');
      expect(comp1Scores.overallNotes).toContain('Competency notes');
    });

    it('should handle form submission with valid data', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const initialScores: CompetencyNotes[] = [
        {
          competencyId: 'comp-1',
          overallNotes: 'Initial notes',
          questionRatings: [
            { questionId: 'q-1', rating: 1, notes: '' },
            { questionId: 'q-2', rating: 2, notes: '' },
          ],
        },
        {
          competencyId: 'comp-2',
          overallNotes: '',
          questionRatings: [{ questionId: 'q-3', rating: 3, notes: '' }],
        },
      ];

      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={initialScores} onCompetencyScoresChange={onChange} />,
      );

      // Act - modify a field
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.clear(textarea);
      await user.type(textarea, 'Updated notes');

      // Assert - onChange should reflect the Zod-validated data
      expect(onChange).toHaveBeenCalled();
    });

    it('should use useFieldArray to manage competency fields', () => {
      // Arrange & Act
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={vi.fn()} />,
      );

      // Assert - verify all competency sections are rendered (useFieldArray working)
      expect(screen.getByTestId('competency-section-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('competency-section-comp-2')).toBeInTheDocument();
    });

    it('should apply Zod validation schema to form data', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'Valid notes');

      // Assert - onChange is called with valid form data
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(Array.isArray(lastCall)).toBe(true);
    });

    it('should handle form changes in onChange mode', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act - type into field
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'T');

      // Assert - onChange is called immediately (onChange mode validation)
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Controller Integration', () => {
    it('should render textarea controlled by Controller', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1') as HTMLTextAreaElement;
      const initialValue = textarea.value;
      await user.type(textarea, 'test');

      // Assert - textarea value reflects Controller state
      expect(textarea.value).toBe(initialValue + 'test');
      expect(onChange).toHaveBeenCalled();
    });

    it('should render LikertRating controlled by Controller', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderWithAllProviders(
        <ScorecardForm plan={mockPlan} competencyScores={mockCompetencyScores} onCompetencyScoresChange={onChange} />,
      );

      // Act
      const ratingOptions = screen.getAllByTestId(/rating-option-/);
      if (ratingOptions.length > 0) {
        await user.click(ratingOptions[0]);
      }

      // Assert
      expect(onChange).toHaveBeenCalled();
    });
  });
});

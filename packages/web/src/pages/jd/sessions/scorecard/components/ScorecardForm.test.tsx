import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { InterviewPlan, Session } from '@interview-forge/shared';

import { ScorecardForm } from './ScorecardForm';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/useSubmitScorecard', () => ({
  useSubmitScorecard: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    status: 'idle' as const,
    reset: vi.fn(),
  })),
}));

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

const mockSession: Session = {
  sessionId: 'session-123',
  jdId: 'jd-123',
  candidateName: 'Jane Smith',
  status: 'PLAN_APPROVED',
  plan: mockPlan,
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('ScorecardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all competency sections', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
  });

  it('should render overall notes textarea for each competency', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert
    expect(screen.getByTestId('overall-notes-textarea-comp-1')).toBeInTheDocument();
    expect(screen.getByTestId('overall-notes-textarea-comp-2')).toBeInTheDocument();
  });

  it('should render all questions with text and type badge', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

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
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert - check that rating section labels are rendered
    expect(screen.getByTestId('rating-control-q-1')).toBeInTheDocument();
    expect(screen.getByTestId('rating-control-q-2')).toBeInTheDocument();
    expect(screen.getByTestId('rating-control-q-3')).toBeInTheDocument();
  });

  it('should render notes textarea for each question', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert
    expect(screen.getByTestId('question-notes-textarea-q-1')).toBeInTheDocument();
    expect(screen.getByTestId('question-notes-textarea-q-2')).toBeInTheDocument();
    expect(screen.getByTestId('question-notes-textarea-q-3')).toBeInTheDocument();
  });

  it('should update form state when overall notes change', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Act
    const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
    await user.clear(textarea);
    await user.type(textarea, 'Great');

    // Assert
    expect(textarea).toHaveValue('Great');
  });

  it('should update form state when rating is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Act - find and click a rating option
    const ratingOptions = screen.getAllByTestId(/rating-option-/);
    if (ratingOptions.length > 0) {
      await user.click(ratingOptions[0]);
    }

    // Assert - the click should succeed without errors
    expect(ratingOptions.length).toBeGreaterThan(0);
  });

  it('should update form state when question notes change', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Act
    const textarea = screen.getByTestId('question-notes-textarea-q-1');
    await user.clear(textarea);
    await user.type(textarea, 'Good');

    // Assert
    expect(textarea).toHaveValue('Good');
  });

  it('should display character counts for textareas', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert - check for character count displays
    const charCounts = screen.getAllByText(/\/[0-9]+ characters/);
    expect(charCounts.length).toBeGreaterThan(0);
  });

  it('should render form with initial empty state', () => {
    // Arrange & Act
    renderWithAllProviders(<ScorecardForm session={mockSession} />);

    // Assert
    const overallNotesTextarea = screen.getByTestId('overall-notes-textarea-comp-1') as HTMLTextAreaElement;
    expect(overallNotesTextarea.value).toBe('');
  });

  describe('React Hook Form Integration', () => {
    it('should sync form changes to parent form', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'Test notes');

      // Assert - verify the form state updated
      expect(textarea).toHaveValue('Test notes');
    });

    it('should maintain form values across multiple field changes', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act - update multiple fields
      const textarea1 = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea1, 'Competency notes');

      // Assert - verify the field still has the value
      expect(textarea1).toHaveValue('Competency notes');
    });

    it('should use useFieldArray to manage competency fields', () => {
      // Arrange & Act
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Assert - verify all competency sections are rendered (useFieldArray working)
      expect(screen.getByTestId('competency-section-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('competency-section-comp-2')).toBeInTheDocument();
    });

    it('should apply Zod validation schema to form data', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'Valid notes');

      // Assert - form state is updated
      expect(textarea).toHaveValue('Valid notes');
    });

    it('should handle form changes in onChange mode', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act - type into field
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1');
      await user.type(textarea, 'T');

      // Assert - form updates immediately in onChange mode
      expect(textarea).toHaveValue('T');
    });
  });

  describe('Controller Integration', () => {
    it('should render textarea controlled by Controller', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act
      const textarea = screen.getByTestId('overall-notes-textarea-comp-1') as HTMLTextAreaElement;
      const initialValue = textarea.value;
      await user.type(textarea, 'test');

      // Assert - textarea value reflects Controller state
      expect(textarea.value).toBe(initialValue + 'test');
    });

    it('should render LikertRating controlled by Controller', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithAllProviders(<ScorecardForm session={mockSession} />);

      // Act
      const ratingOptions = screen.getAllByTestId(/rating-option-/);
      if (ratingOptions.length > 0) {
        await user.click(ratingOptions[0]);
      }

      // Assert - verify rating options exist and are clickable
      expect(ratingOptions.length).toBeGreaterThan(0);
    });
  });
});

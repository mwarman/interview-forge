import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session, InterviewPlan } from '@interview-forge/shared';

import { ScorecardPage } from './ScorecardPage';

// Mock dependencies
vi.mock('@/common/api/useGetSession', () => ({
  useGetSession: vi.fn(),
}));

vi.mock('./api/useSubmitScorecard', () => ({
  useSubmitScorecard: vi.fn(),
}));

vi.mock('./components/ScorecardForm', () => ({
  ScorecardForm: () => <div data-testid="scorecard-form-mock">Form Mock</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({
      jdId: 'jd-123',
      sessionId: 'session-123',
    }),
  };
});

const mockPlan: InterviewPlan = {
  planId: 'plan-123',
  competencies: [
    {
      competencyId: 'comp-1',
      name: 'Leadership',
      description: 'Leadership skills',
      evaluationCriteria: 'Can lead teams',
      questions: [
        {
          questionId: 'q-1',
          text: 'Tell me about leadership',
          type: 'BEHAVIORAL',
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

const getDefaultMutationReturn = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  status: 'idle' as const,
  reset: vi.fn(),
});

describe('ScorecardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state while fetching session', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(screen.getByTestId('scorecard-page-loading')).toBeInTheDocument();
  });

  it('should show error state when session fetch fails', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(screen.getByTestId('session-load-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load session')).toBeInTheDocument();
  });

  it('should redirect to plan page when status is not PLAN_APPROVED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');
    const notApprovedSession: Session = { ...mockSession, status: 'PLAN_PENDING' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: notApprovedSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      '/jds/jd-123/sessions/session-123/plan',
      expect.objectContaining({ replace: true }),
    );
  });

  it('should redirect to assessment page when status is SCORED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');
    const scoredSession: Session = { ...mockSession, status: 'SCORED' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: scoredSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      '/jds/jd-123/sessions/session-123/assessment',
      expect.objectContaining({ replace: true }),
    );
  });

  it('should render scorecard page when status is PLAN_APPROVED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(screen.getByTestId('scorecard-page')).toBeInTheDocument();
    expect(screen.getByText('Score the Interview')).toBeInTheDocument();
  });

  it('should render scorecard form', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(screen.getByTestId('scorecard-form-mock')).toBeInTheDocument();
  });

  it('should render scorecard form', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(screen.getByTestId('scorecard-form-mock')).toBeInTheDocument();
  });

  it('should redirect for PLAN_GENERATING status', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');
    const generatingSession: Session = { ...mockSession, status: 'PLAN_GENERATING' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: generatingSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      '/jds/jd-123/sessions/session-123/plan',
      expect.objectContaining({ replace: true }),
    );
  });

  it('should redirect to assessment page for ASSESS_GENERATING status', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');
    const assessGeneratingSession: Session = { ...mockSession, status: 'ASSESS_GENERATING' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: assessGeneratingSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      '/jds/jd-123/sessions/session-123/assessment',
      expect.objectContaining({ replace: true }),
    );
  });

  it('should redirect to assessment page for ASSESSED status', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useSubmitScorecard } = await import('./api/useSubmitScorecard');
    const assessedSession: Session = { ...mockSession, status: 'ASSESSED' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: assessedSession,
      isError: false,
    } as never);

    vi.mocked(useSubmitScorecard).mockReturnValue(getDefaultMutationReturn() as never);

    // Act
    renderWithAllProviders(<ScorecardPage />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      '/jds/jd-123/sessions/session-123/assessment',
      expect.objectContaining({ replace: true }),
    );
  });
});

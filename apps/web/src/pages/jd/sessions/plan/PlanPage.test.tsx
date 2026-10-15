import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session } from '@interview-forge/shared';
import { PlanPage } from './PlanPage';

// Mock the session fetching and plan operations
vi.mock('@/common/api/useGetSession', () => ({
  useGetSession: vi.fn(),
}));

vi.mock('./api/useCreatePlan', () => ({
  useCreatePlan: vi.fn(),
}));

vi.mock('./api/useApprovePlan', () => ({
  useApprovePlan: vi.fn(),
}));

// Mock state components
vi.mock('./components/PlanGeneratingState', () => ({
  PlanGeneratingState: () => <div data-testid="plan-generating-state-mock">Generating...</div>,
}));

vi.mock('./components/PlanErrorState', () => ({
  PlanErrorState: ({ onRetry }: { onRetry: () => void }) => (
    <div data-testid="plan-error-state-mock">
      <button onClick={onRetry} data-testid="error-retry-button">
        Retry
      </button>
    </div>
  ),
}));

vi.mock('./components/PlanReadyState', () => ({
  PlanReadyState: ({ onApprovePlan }: { onApprovePlan: (plan: unknown) => void }) => (
    <div data-testid="plan-ready-state-mock">
      <button
        onClick={() =>
          onApprovePlan({
            planId: 'plan-123',
            competencies: [],
            generatedAt: '2026-06-01T12:00:00Z',
          })
        }
        data-testid="approve-plan-button-mock"
      >
        Approve
      </button>
    </div>
  ),
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

const mockSession: Session = {
  sessionId: 'session-123',
  jdId: 'jd-123',
  candidateName: 'Jane Smith',
  status: 'PLAN_PENDING',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

const defaultMockHookReturn = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  status: 'idle',
  reset: vi.fn(),
};

describe('PlanPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for all hooks
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useCreatePlan } = await import('./api/useCreatePlan');
    const { useApprovePlan } = await import('./api/useApprovePlan');

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
      isSuccess: true,
    } as never);

    vi.mocked(useCreatePlan).mockReturnValue(defaultMockHookReturn as never);
    vi.mocked(useApprovePlan).mockReturnValue(defaultMockHookReturn as never);
  });

  it('should show loading state initially', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByTestId('plan-page-loading')).toBeInTheDocument();
  });

  it('should show error state when session fetch fails', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByTestId('plan-page-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load session')).toBeInTheDocument();
  });

  it('should show generating state when session status is PLAN_GENERATING', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useCreatePlan } = await import('./api/useCreatePlan');
    const generatingSession: Session = { ...mockSession, status: 'PLAN_GENERATING' };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: generatingSession,
      isError: false,
    } as never);

    vi.mocked(useCreatePlan).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByTestId('plan-generating-state')).toBeInTheDocument();
  });

  it('should show error state when session status is PLAN_ERROR', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useCreatePlan } = await import('./api/useCreatePlan');
    const errorSession: Session = {
      ...mockSession,
      status: 'PLAN_ERROR',
      plan: { planErrorMessage: 'Failed to generate plan' } as never,
    };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: errorSession,
      isError: false,
    } as never);

    vi.mocked(useCreatePlan).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByTestId('plan-error-state-mock')).toBeInTheDocument();
  });

  it('should show ready state when session status is PLAN_GENERATED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { useApprovePlan } = await import('./api/useApprovePlan');
    const readySession: Session = {
      ...mockSession,
      status: 'PLAN_GENERATED',
      plan: {
        planId: 'plan-123',
        competencies: [],
        generatedAt: '2026-06-01T12:00:00Z',
      } as never,
    };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: readySession,
      isError: false,
    } as never);

    vi.mocked(useApprovePlan).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByTestId('plan-ready-state-mock')).toBeInTheDocument();
  });

  it('should show approved state when session status is PLAN_APPROVED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const approvedSession: Session = {
      ...mockSession,
      status: 'PLAN_APPROVED',
    };

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: approvedSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<PlanPage />);

    // Assert
    expect(screen.getByText('Plan Approved')).toBeInTheDocument();
    expect(screen.getByText(/ready for the next phase/)).toBeInTheDocument();
  });
});

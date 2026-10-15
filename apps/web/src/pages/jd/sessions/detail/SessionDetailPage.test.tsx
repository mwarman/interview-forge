import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session } from '@interview-forge/shared';

import { SessionDetailPage } from './SessionDetailPage';

// Mock dependencies
vi.mock('@/common/api/useGetSession', () => ({
  useGetSession: vi.fn(),
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
  status: 'SCORED',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('SessionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state while fetching session', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('session-detail-page-loading')).toBeInTheDocument();
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
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('session-detail-page-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load session')).toBeInTheDocument();
  });

  it('should render session detail page with session data', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('session-detail-page')).toBeInTheDocument();
    expect(screen.getByTestId('session-detail-candidate-name')).toBeInTheDocument();
  });

  it('should display dynamic status badge', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Scored');
  });

  it('should display candidate information', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('session-detail-candidate-name')).toHaveTextContent('Jane Smith');
  });

  it('should display creation date', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByText('6/1/2026')).toBeInTheDocument();
  });

  it('should render back button', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('should handle back button click', async () => {
    // Arrange
    const user = userEvent.setup();
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    renderWithAllProviders(<SessionDetailPage />);

    // Act
    await user.click(screen.getByTestId('back-button'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should show assessment CTA when status is SCORED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('assessment-cta')).toBeInTheDocument();
    expect(screen.getByText('Ready for Assessment')).toBeInTheDocument();
  });

  it('should show generate assessment button when status is SCORED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('generate-assessment-button')).toBeInTheDocument();
    expect(screen.getByTestId('generate-assessment-button')).toBeDisabled();
  });

  it('should show completion CTA when status is ASSESSED', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const assessedSession: Session = { ...mockSession, status: 'ASSESSED' };
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: assessedSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByTestId('complete-cta')).toBeInTheDocument();
    expect(screen.getByText('Assessment Complete')).toBeInTheDocument();
  });

  it('should show completion CTA when status is COMPLETE', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const completeSession: Session = { ...mockSession, status: 'COMPLETE' };
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: completeSession,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<SessionDetailPage />);

    // Assert
    expect(screen.getByText('Interview Complete')).toBeInTheDocument();
  });

  it('should update status badge when session status changes', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const { rerender } = renderWithAllProviders(<SessionDetailPage />);

    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: mockSession,
      isError: false,
    } as never);

    rerender(<SessionDetailPage />);

    // Assert initial status
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Scored');

    // Act - change status
    const assessedSession: Session = { ...mockSession, status: 'ASSESSED' };
    vi.mocked(useGetSession).mockReturnValue({
      isLoading: false,
      data: assessedSession,
      isError: false,
    } as never);

    rerender(<SessionDetailPage />);

    // Assert updated status
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Assessed');
  });

  it('should display different status badges for various statuses', async () => {
    // Arrange
    const { useGetSession } = await import('@/common/api/useGetSession');
    const statuses = ['PLAN_PENDING', 'PLAN_APPROVED', 'ASSESSED', 'COMPLETE'];

    for (const status of statuses) {
      vi.clearAllMocks();

      const session: Session = { ...mockSession, status: status as Session['status'] };
      vi.mocked(useGetSession).mockReturnValue({
        isLoading: false,
        data: session,
        isError: false,
      } as never);

      // Act
      const { unmount } = renderWithAllProviders(<SessionDetailPage />);

      // Assert
      expect(screen.getByTestId('session-status-badge')).toBeInTheDocument();

      unmount();
    }
  });
});

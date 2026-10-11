import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session } from '@interview-forge/shared';

import { JDSessionsPage } from './JDSessionsPage';

vi.mock('@/pages/jd/sessions/list/api/useGetSessions', () => ({
  useGetSessions: vi.fn(),
}));

vi.mock('@/pages/jd/sessions/list/components/SessionCard', () => ({
  SessionCard: ({ session }: { session: Session }) => (
    <div data-testid="session-card-mock" data-session-id={session.sessionId}>
      {session.candidateName}
    </div>
  ),
}));

vi.mock('@/pages/jd/sessions/list/components/NewSessionDialog', () => ({
  NewSessionDialog: ({ open, onSuccess }: { open: boolean; onSuccess: (id: string) => void }) =>
    open ? (
      <div data-testid="new-session-dialog-mock">
        <button onClick={() => onSuccess('new-session-id')} data-testid="dialog-success-trigger">
          Trigger Success
        </button>
      </div>
    ) : null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ jdId: '550e8400-e29b-41d4-a716-446655440001' }),
  };
});

const mockSessions: Session[] = [
  {
    sessionId: '660e8400-e29b-41d4-a716-446655440001',
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    candidateName: 'Jane Smith',
    status: 'PLAN_PENDING',
    createdAt: '2026-06-01T12:00:00Z',
    TTL: 9999999999,
  },
  {
    sessionId: '660e8400-e29b-41d4-a716-446655440002',
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    candidateName: 'John Doe',
    status: 'COMPLETE',
    createdAt: '2026-06-02T12:00:00Z',
    TTL: 9999999999,
  },
];

describe('JDSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page container', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByTestId('jd-sessions-page')).toBeInTheDocument();
  });

  it('should render the page title, back button, and new session button', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('new-session-button')).toBeInTheDocument();
  });

  it('should navigate back to /jds when back button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);
    renderWithAllProviders(<JDSessionsPage />);

    // Act
    await user.click(screen.getByTestId('back-button'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/jds');
  });

  it('should render a loading skeleton while fetching', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByTestId('sessions-skeleton')).toBeInTheDocument();
  });

  it('should render an error state on fetch failure', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByTestId('sessions-error')).toBeInTheDocument();
  });

  it('should render the empty state when no sessions exist', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByTestId('sessions-empty')).toBeInTheDocument();
    expect(screen.getByText('No Sessions Yet')).toBeInTheDocument();
    expect(screen.getByTestId('empty-new-session-button')).toBeInTheDocument();
  });

  it('should render session cards when sessions are available', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDSessionsPage />);

    // Assert
    expect(screen.getByTestId('sessions-list')).toBeInTheDocument();
    const cards = screen.getAllByTestId('session-card-mock');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should open the new session dialog when "New Session" button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);
    renderWithAllProviders(<JDSessionsPage />);

    // Act
    await user.click(screen.getByTestId('new-session-button'));

    // Assert
    expect(screen.getByTestId('new-session-dialog-mock')).toBeInTheDocument();
  });

  it('should navigate to the plan page after a session is created', async () => {
    // Arrange
    const user = userEvent.setup();
    const { useGetSessions } = await import('@/pages/jd/sessions/list/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    } as never);
    renderWithAllProviders(<JDSessionsPage />);

    // Open the dialog
    await user.click(screen.getByTestId('new-session-button'));

    // Trigger success
    await user.click(screen.getByTestId('dialog-success-trigger'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/jds/550e8400-e29b-41d4-a716-446655440001/sessions/new-session-id/plan');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session } from '@interview-forge/shared';

import { SessionCard } from './SessionCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  sessionId: '660e8400-e29b-41d4-a716-446655440001',
  jdId: '550e8400-e29b-41d4-a716-446655440001',
  candidateName: 'Jane Smith',
  status: 'PLAN_PENDING',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
  ...overrides,
});

describe('SessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the candidate name', () => {
    // Arrange & Act
    renderWithAllProviders(<SessionCard session={makeSession()} />);

    // Assert
    expect(screen.getByTestId('session-candidate-name')).toHaveTextContent('Jane Smith');
  });

  it('should render the status badge with human-readable label', () => {
    // Arrange & Act
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'PLAN_PENDING' })} />);

    // Assert
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Plan Pending');
  });

  it('should render "Plan Generated" for PLAN_GENERATED status', () => {
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'PLAN_GENERATED' })} />);
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Plan Generated');
  });

  it('should render "Plan Approved" for PLAN_APPROVED status', () => {
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'PLAN_APPROVED' })} />);
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Plan Approved');
  });

  it('should render "Scored" for SCORED status', () => {
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'SCORED' })} />);
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Scored');
  });

  it('should render "Assessed" for ASSESSED status', () => {
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'ASSESSED' })} />);
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Assessed');
  });

  it('should render "Complete" for COMPLETE status', () => {
    renderWithAllProviders(<SessionCard session={makeSession({ status: 'COMPLETE' })} />);
    expect(screen.getByTestId('session-status-badge')).toHaveTextContent('Complete');
  });

  describe('routing behavior', () => {
    it('should navigate to plan page for PLAN_PENDING status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'PLAN_PENDING' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/plan`);
    });

    it('should navigate to plan page for PLAN_GENERATING status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'PLAN_GENERATING' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/plan`);
    });

    it('should navigate to plan page for PLAN_ERROR status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'PLAN_ERROR' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/plan`);
    });

    it('should navigate to plan page for PLAN_GENERATED status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'PLAN_GENERATED' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/plan`);
    });

    it('should navigate to scorecard page for PLAN_APPROVED status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'PLAN_APPROVED' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/scorecard`);
    });

    it('should navigate to assessment page for SCORED status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'SCORED' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/assessment`);
    });

    it('should navigate to assessment page for ASSESS_GENERATING status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'ASSESS_GENERATING' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/assessment`);
    });

    it('should navigate to assessment page for ASSESS_ERROR status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'ASSESS_ERROR' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/assessment`);
    });

    it('should navigate to assessment page for ASSESSED status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'ASSESSED' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/assessment`);
    });

    it('should navigate to assessment page for COMPLETE status', async () => {
      // Arrange
      const user = userEvent.setup();
      const session = makeSession({ status: 'COMPLETE' });
      renderWithAllProviders(<SessionCard session={session} />);

      // Act
      await user.click(screen.getByTestId('session-card'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/jds/${session.jdId}/sessions/${session.sessionId}/assessment`);
    });
  });
});

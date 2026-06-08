import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithAllProviders } from '@/test/test-utils';
import { Session } from '@interview-forge/shared';

import { SessionCard } from './SessionCard';

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
});

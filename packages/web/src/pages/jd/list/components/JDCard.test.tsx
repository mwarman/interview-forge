import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { JobDescription } from '@interview-forge/shared';

import { JDCard, formatTTLCountdown } from './JDCard';

vi.mock('@/pages/jd/sessions/api/useGetSessions', () => ({
  useGetSessions: vi.fn(() => ({ data: [] })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockJD: JobDescription = {
  jdId: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Senior Software Engineer',
  rawText: 'We are looking for a Senior Software Engineer...',
  createdAt: '2026-06-01T12:00:00Z',
  TTL: 9999999999,
};

describe('JDCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the JD title', () => {
    // Arrange & Act
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Assert
    expect(screen.getByTestId('jd-card-title')).toHaveTextContent('Senior Software Engineer');
  });

  it('should render the formatted createdAt date', () => {
    // Arrange & Act
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Assert
    expect(screen.getByTestId('jd-card-date')).toBeInTheDocument();
  });

  it('should render the TTL countdown', () => {
    // Arrange & Act
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Assert
    expect(screen.getByTestId('jd-card-ttl')).toBeInTheDocument();
  });

  it('should render session count badge with 0 sessions when none exist', () => {
    // Arrange & Act
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Assert
    expect(screen.getByTestId('jd-card-session-count')).toHaveTextContent('0 sessions');
  });

  it('should render "session" (singular) when count is 1', async () => {
    // Arrange
    const { useGetSessions } = await import('@/pages/jd/sessions/api/useGetSessions');
    vi.mocked(useGetSessions).mockReturnValue({ data: [{ sessionId: 'x' }] } as never);

    // Act
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Assert
    expect(screen.getByTestId('jd-card-session-count')).toHaveTextContent('1 session');
  });

  it('should navigate to the sessions page when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithAllProviders(<JDCard jd={mockJD} />);

    // Act
    await user.click(screen.getByTestId('jd-card'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(`/jds/${mockJD.jdId}/sessions`);
  });
});

describe('formatTTLCountdown', () => {
  it('should return "Expired" when TTL is in the past', () => {
    expect(formatTTLCountdown(0)).toBe('Expired');
  });

  it('should return hours when TTL is less than 24 hours away', () => {
    const ttl = Math.floor(Date.now() / 1000) + 3600 * 5; // 5 hours from now
    expect(formatTTLCountdown(ttl)).toBe('Expires in 5h');
  });

  it('should return days when TTL is more than 24 hours away', () => {
    const ttl = Math.floor(Date.now() / 1000) + 3600 * 48; // 2 days from now
    expect(formatTTLCountdown(ttl)).toBe('Expires in 2d');
  });
});

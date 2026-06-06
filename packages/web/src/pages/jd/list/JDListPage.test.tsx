import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithAllProviders } from '@/test/test-utils';
import { JobDescription } from '@interview-forge/shared';

import { JDListPage } from './JDListPage';

vi.mock('@/pages/jd/list/api/useGetJobDescriptions', () => ({
  useGetJobDescriptions: vi.fn(),
}));

vi.mock('@/pages/jd/list/components/JDCard', () => ({
  JDCard: ({ jd }: { jd: JobDescription }) => (
    <div data-testid="jd-card-mock" data-jd-id={jd.jdId}>
      {jd.title}
    </div>
  ),
}));

const mockJobDescriptions: JobDescription[] = [
  {
    jdId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Senior Software Engineer',
    rawText: 'We are looking for a Senior Software Engineer...',
    createdAt: '2026-06-01T12:00:00Z',
    TTL: 9999999999,
  },
  {
    jdId: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Product Manager',
    rawText: 'We are looking for a Product Manager...',
    createdAt: '2026-06-02T12:00:00Z',
    TTL: 9999999999,
  },
];

describe('JDListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the job list page container', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: mockJobDescriptions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByTestId('job-list-page')).toBeInTheDocument();
  });

  it('should render the page title and create button', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: mockJobDescriptions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByText('Job Descriptions')).toBeInTheDocument();
    expect(screen.getByTestId('create-jd-button')).toBeInTheDocument();
  });

  it('should render a loading skeleton while fetching', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByTestId('jd-list-skeleton')).toBeInTheDocument();
  });

  it('should render an error state on fetch failure', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByTestId('jd-list-error')).toBeInTheDocument();
  });

  it('should render the empty state when no JDs exist', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByTestId('jd-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No Job Descriptions')).toBeInTheDocument();
    expect(screen.getByTestId('empty-create-jd-button')).toBeInTheDocument();
  });

  it('should render JD cards when job descriptions are available', async () => {
    // Arrange
    const { useGetJobDescriptions } = await import('@/pages/jd/list/api/useGetJobDescriptions');
    vi.mocked(useGetJobDescriptions).mockReturnValue({
      data: mockJobDescriptions,
      isLoading: false,
      isError: false,
    } as never);

    // Act
    renderWithAllProviders(<JDListPage />);

    // Assert
    expect(screen.getByTestId('jd-list-grid')).toBeInTheDocument();
    const cards = screen.getAllByTestId('jd-card-mock');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
  });
});

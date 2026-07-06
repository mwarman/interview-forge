import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { Session, Assessment } from '@interview-forge/shared';
import { useGetSession } from '@/common/api/useGetSession';
import { useCreateAssessment } from './api/useCreateAssessment';
import { useApproveAssessment } from './api/useApproveAssessment';
import { AssessmentPage } from './AssessmentPage';

// Mock dependencies
vi.mock('@/common/api/useGetSession');
vi.mock('./api/useCreateAssessment');
vi.mock('./api/useApproveAssessment');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockUseGetSession = vi.mocked(useGetSession);
const mockUseCreateAssessment = vi.mocked(useCreateAssessment);
const mockUseApproveAssessment = vi.mocked(useApproveAssessment);

const mockAssessment: Assessment = {
  assessmentId: '123e4567-e89b-12d3-a456-426614174000',
  recommendation: 'HIRE',
  confidence: 'HIGH',
  reasoning: 'Candidate demonstrated strong technical fundamentals.',
  competencyAssessments: [
    {
      competencyId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'System Design',
      strengths: 'Excellent',
      concerns: 'Limited experience',
      conflictsIdentified: [],
    },
  ],
  generatedAt: '2026-06-22T10:30:00Z',
};

const mockSession: Session = {
  sessionId: '223e4567-e89b-12d3-a456-426614174000',
  jdId: '123e4567-e89b-12d3-a456-426614174000',
  candidateName: 'John Doe',
  status: 'SCORED',
  createdAt: '2026-06-22T10:30:00Z',
  TTL: 1234567890,
};

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page header with candidate name', async () => {
    // Arrange
    mockUseGetSession.mockReturnValue({
      data: mockSession,
      isLoading: false,
      isError: false,
    } as UseQueryResult<Session>);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as UseMutationResult);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as UseMutationResult);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('assessment-page')).toBeInTheDocument();
    });
  });

  it('should render generating state when status is ASSESS_GENERATING', async () => {
    // Arrange
    const generatingSession: Session = {
      ...mockSession,
      status: 'ASSESS_GENERATING',
    };

    mockUseGetSession.mockReturnValue({
      data: generatingSession,
      isLoading: false,
      isError: false,
    } as UseQueryResult<Session>);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as UseMutationResult);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as UseMutationResult);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('assessment-generating-state')).toBeInTheDocument();
    });
  });

  it('should render error state when status is ASSESS_ERROR', async () => {
    // Arrange
    const errorSession: Session = {
      ...mockSession,
      status: 'ASSESS_ERROR',
      assessErrorMessage: 'Assessment generation timeout',
    };

    mockUseGetSession.mockReturnValue({
      data: errorSession,
      isLoading: false,
      isError: false,
    } as unknown);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('assessment-error-state')).toBeInTheDocument();
      expect(screen.getByText('Assessment generation timeout')).toBeInTheDocument();
    });
  });

  it('should render ready state when status is ASSESSED', async () => {
    // Arrange
    const assessedSession: Session = {
      ...mockSession,
      status: 'ASSESSED',
      assessment: mockAssessment,
    };

    mockUseGetSession.mockReturnValue({
      data: assessedSession,
      isLoading: false,
      isError: false,
    } as unknown);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('assessment-ready-state')).toBeInTheDocument();
      expect(screen.getByText('Assessment Summary')).toBeInTheDocument();
    });
  });

  it('should render complete state when status is COMPLETE', async () => {
    // Arrange
    const completeSession: Session = {
      ...mockSession,
      status: 'COMPLETE',
      assessment: mockAssessment,
    };

    mockUseGetSession.mockReturnValue({
      data: completeSession,
      isLoading: false,
      isError: false,
    } as unknown);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('assessment-complete-state')).toBeInTheDocument();
      expect(screen.getByText('Final Assessment')).toBeInTheDocument();
      expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
    });
  });

  it('should call createAssessment on mount when status is SCORED', async () => {
    // Arrange
    const mutateMock = vi.fn();
    mockUseGetSession.mockReturnValue({
      data: mockSession,
      isLoading: false,
      isError: false,
    } as unknown);

    mockUseCreateAssessment.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
    } as unknown);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledOnce();
    });
  });

  it('should render loading state when session is loading', () => {
    // Arrange
    mockUseGetSession.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown);

    mockUseCreateAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    mockUseApproveAssessment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown);

    // Act
    render(<AssessmentPage />, { wrapper });

    // Assert
    expect(screen.getByTestId('assessment-page-loading')).toBeInTheDocument();
  });
});

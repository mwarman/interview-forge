import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/common/utils/query-client';
import { UploadMode } from './UploadMode';

// Mock axios before importing hooks to prevent api-client initialization issues
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      interceptors: { response: { use: vi.fn() } },
    })),
    isAxiosError: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock hooks after axios is mocked
vi.mock('../api/useCreatePresignedUrl');
vi.mock('../api/useCreateJobDescription');

import { useCreatePresignedUrl } from '../api/useCreatePresignedUrl';
import { useCreateJobDescription } from '../api/useCreateJobDescription';

interface MockMutation {
  mutateAsync: ReturnType<typeof vi.fn>;
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

describe('UploadMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockPresignedMutation: MockMutation = {
      mutateAsync: vi.fn().mockResolvedValue({
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
        presignedUrl: 'https://s3.amazonaws.com/bucket/presigned-url',
      }),
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    };
    vi.mocked(useCreatePresignedUrl).mockReturnValue(
      mockPresignedMutation as unknown as ReturnType<typeof useCreatePresignedUrl>,
    );

    const mockJdMutation: MockMutation = {
      mutateAsync: vi.fn().mockResolvedValue({
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Senior Engineer',
        rawText: 'Extracted from PDF...',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/resume.pdf',
        createdAt: '2026-06-04T12:00:00Z',
        TTL: 1719129600,
      }),
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    };
    vi.mocked(useCreateJobDescription).mockReturnValue(
      mockJdMutation as unknown as ReturnType<typeof useCreateJobDescription>,
    );
  });

  it('should render upload mode form', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId('upload-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('upload-submit-button')).toBeInTheDocument();
  });

  it('should display title label and placeholder', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByTestId('upload-title-input')).toHaveAttribute('placeholder', 'e.g., Senior Software Engineer');
  });

  it('should display supported file formats message', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByText(/Supported formats: PDF, TXT/i)).toBeInTheDocument();
  });

  it('should display create job description button', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId('upload-submit-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Job Description/i })).toBeInTheDocument();
  });

  it('should have disabled submit button by default', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    const submitButton = screen.getByTestId('upload-submit-button') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('should have file input element', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should display dropzone area', () => {
    // Arrange & Act
    render(
      <QueryClientProvider client={queryClient}>
        <UploadMode />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByText(/Drag and drop your file here/i)).toBeInTheDocument();
  });
});

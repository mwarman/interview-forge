import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/common/utils/query-client';
import { JDCreatePage } from './JDCreatePage';

// Mock the child components
vi.mock('./components/PasteMode', () => ({
  PasteMode: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="paste-mode-mock">
      <button onClick={onSuccess} data-testid="paste-mode-success-button">
        Trigger Success
      </button>
    </div>
  ),
}));

vi.mock('./components/UploadMode', () => ({
  UploadMode: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="upload-mode-mock">
      <button onClick={onSuccess} data-testid="upload-mode-success-button">
        Trigger Success
      </button>
    </div>
  ),
}));

describe('JDCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page with title and description', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Assert
    expect(screen.getByText('Create Job Description')).toBeInTheDocument();
    expect(screen.getByText(/Add a new job description by pasting text or uploading a file./i)).toBeInTheDocument();
  });

  it('should render two tabs: Paste Text and Upload File', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Assert
    expect(screen.getByTestId('paste-tab')).toBeInTheDocument();
    expect(screen.getByTestId('upload-tab')).toBeInTheDocument();
    expect(screen.getByText('Paste Text')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should render PasteMode component by default', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Assert
    expect(screen.getByTestId('paste-mode-mock')).toBeInTheDocument();
  });

  it('should switch to UploadMode when Upload File tab is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Act
    const uploadTab = screen.getByTestId('upload-tab');
    await user.click(uploadTab);

    // Assert
    expect(screen.getByTestId('upload-mode-mock')).toBeInTheDocument();
  });

  it('should switch back to PasteMode when Paste Text tab is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Act - switch to upload mode
    const uploadTab = screen.getByTestId('upload-tab');
    await user.click(uploadTab);
    expect(screen.getByTestId('upload-mode-mock')).toBeInTheDocument();

    // Act - switch back to paste mode
    const pasteTab = screen.getByTestId('paste-tab');
    await user.click(pasteTab);

    // Assert
    expect(screen.getByTestId('paste-mode-mock')).toBeInTheDocument();
  });

  it('should render the page with correct data-testid', () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <JDCreatePage />
        </QueryClientProvider>
      </BrowserRouter>,
    );

    // Assert
    expect(screen.getByTestId('jd-create-page')).toBeInTheDocument();
    expect(screen.getByTestId('jd-create-tabs')).toBeInTheDocument();
  });
});

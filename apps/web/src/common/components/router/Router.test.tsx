import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

import { ThemeProvider } from '@/common/providers/ThemeProvider';

import { Router } from './Router';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

describe('Router', () => {
  it('should render successfully', () => {
    // Arrange
    const queryClient = createTestQueryClient();

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId('job-list-page')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { PlanErrorState } from './PlanErrorState';

describe('PlanErrorState', () => {
  it('should render error message', () => {
    // Arrange
    const errorMessage = 'Failed to generate plan due to missing job requirements.';

    // Act
    renderWithAllProviders(<PlanErrorState errorMessage={errorMessage} onRetry={vi.fn()} />);

    // Assert
    expect(screen.getByText('Plan Generation Failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onRetry = vi.fn();

    // Act
    renderWithAllProviders(<PlanErrorState errorMessage="Error" onRetry={onRetry} />);
    await user.click(screen.getByTestId('retry-generation-button'));

    // Assert
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should disable retry button when isRetrying is true', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanErrorState errorMessage="Error" onRetry={vi.fn()} isRetrying={true} />);

    // Assert
    const button = screen.getByTestId('retry-generation-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Retrying…');
  });

  it('should show "Retry Generation" text when not retrying', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanErrorState errorMessage="Error" onRetry={vi.fn()} isRetrying={false} />);

    // Assert
    expect(screen.getByTestId('retry-generation-button')).toHaveTextContent('Retry Generation');
  });

  it('should accept custom testId', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanErrorState errorMessage="Error" onRetry={vi.fn()} testId="custom-error" />);

    // Assert
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
  });
});

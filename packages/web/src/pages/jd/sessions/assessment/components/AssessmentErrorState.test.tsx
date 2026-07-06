import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AssessmentErrorState } from './AssessmentErrorState';

describe('AssessmentErrorState', () => {
  it('should render error message and retry button', () => {
    // Arrange
    const onRetry = vi.fn();

    // Act
    render(<AssessmentErrorState errorMessage="Test error" onRetry={onRetry} />);

    // Assert
    expect(screen.getByTestId('assessment-error-state')).toBeInTheDocument();
    expect(screen.getByText('Assessment Generation Failed')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error');
    expect(screen.getByTestId('retry-generation-button')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    // Arrange
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<AssessmentErrorState errorMessage="Test error" onRetry={onRetry} />);

    // Act
    await user.click(screen.getByTestId('retry-generation-button'));

    // Assert
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should show retrying state when isRetrying is true', () => {
    // Arrange
    const onRetry = vi.fn();

    // Act
    render(<AssessmentErrorState errorMessage="Test error" onRetry={onRetry} isRetrying />);

    // Assert
    expect(screen.getByTestId('retry-generation-button')).toHaveTextContent('Retrying…');
    expect(screen.getByTestId('retry-generation-button')).toBeDisabled();
  });

  it('should use custom test ID when provided', () => {
    // Arrange
    const onRetry = vi.fn();

    // Act
    render(<AssessmentErrorState errorMessage="Test error" onRetry={onRetry} testId="custom-error-state" />);

    // Assert
    expect(screen.getByTestId('custom-error-state')).toBeInTheDocument();
  });
});

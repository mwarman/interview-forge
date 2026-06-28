import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApproveWithOverrideDialog } from './ApproveWithOverrideDialog';

describe('ApproveWithOverrideDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open is true', () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    // Act
    render(<ApproveWithOverrideDialog isOpen={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    // Assert
    expect(screen.getByTestId('approve-with-override-dialog')).toBeInTheDocument();
    expect(screen.getByText('Approve with Override')).toBeInTheDocument();
  });

  it('should display recommendation select and override reason textarea', () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    // Act
    render(<ApproveWithOverrideDialog isOpen={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    // Assert
    expect(screen.getByTestId('recommendation-select')).toBeInTheDocument();
    expect(screen.getByTestId('override-reason-textarea')).toBeInTheDocument();
  });

  it('should disable confirm button initially', () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    // Act
    render(<ApproveWithOverrideDialog isOpen={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    // Assert
    expect(screen.getByTestId('confirm-override-button')).toBeDisabled();
  });

  it('should disable confirm button when loading', () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    // Act
    render(
      <ApproveWithOverrideDialog isOpen={true} onOpenChange={onOpenChange} onConfirm={onConfirm} isLoading={true} />,
    );

    // Assert
    expect(screen.getByTestId('confirm-override-button')).toBeDisabled();
    expect(screen.getByTestId('confirm-override-button')).toHaveTextContent('Confirming…');
  });

  it('should close dialog when cancel button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(<ApproveWithOverrideDialog isOpen={true} onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    // Act
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should use custom test ID when provided', () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    // Act
    render(
      <ApproveWithOverrideDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        testId="custom-dialog"
      />,
    );

    // Assert
    expect(screen.getByTestId('custom-dialog')).toBeInTheDocument();
  });
});

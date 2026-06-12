import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';
import { RemoveConfirmDialog } from './RemoveConfirmDialog';

describe('RemoveConfirmDialog', () => {
  it('should render nothing when closed', () => {
    // Arrange & Act
    const { container } = renderWithAllProviders(
      <RemoveConfirmDialog open={false} onOpenChange={vi.fn()} itemType="question" onConfirm={vi.fn()} />,
    );

    // Assert
    expect(container.querySelector('[data-testid="remove-confirm-dialog"]')).not.toBeInTheDocument();
  });

  it('should render question removal dialog when open', () => {
    // Arrange & Act
    renderWithAllProviders(
      <RemoveConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        itemType="question"
        itemName="What is your experience?"
        onConfirm={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Remove Question?')).toBeInTheDocument();
    expect(screen.getByText(/What is your experience\?/)).toBeInTheDocument();
  });

  it('should render competency removal dialog when open', () => {
    // Arrange & Act
    renderWithAllProviders(
      <RemoveConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        itemType="competency"
        itemName="Communication"
        onConfirm={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Remove Competency?')).toBeInTheDocument();
    expect(screen.getByText(/Communication/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    // Act
    renderWithAllProviders(
      <RemoveConfirmDialog open={true} onOpenChange={vi.fn()} itemType="question" onConfirm={onConfirm} />,
    );
    await user.click(screen.getByTestId('confirm-remove-button'));

    // Assert
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should call onOpenChange(false) when cancel button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    // Act
    renderWithAllProviders(
      <RemoveConfirmDialog open={true} onOpenChange={onOpenChange} itemType="question" onConfirm={vi.fn()} />,
    );
    await user.click(screen.getByTestId('confirm-cancel-button'));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable confirm button when isLoading is true', () => {
    // Arrange & Act
    renderWithAllProviders(
      <RemoveConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        itemType="question"
        onConfirm={vi.fn()}
        isLoading={true}
      />,
    );

    // Assert
    const button = screen.getByTestId('confirm-remove-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Removing…');
  });

  it('should show correct button text when not loading', () => {
    // Arrange & Act
    renderWithAllProviders(
      <RemoveConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        itemType="competency"
        onConfirm={vi.fn()}
        isLoading={false}
      />,
    );

    // Assert
    expect(screen.getByTestId('confirm-remove-button')).toHaveTextContent('Remove Competency');
  });

  it('should accept custom testId', () => {
    // Arrange & Act
    renderWithAllProviders(
      <RemoveConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        itemType="question"
        onConfirm={vi.fn()}
        testId="custom-confirm"
      />,
    );

    // Assert
    expect(screen.getByTestId('custom-confirm')).toBeInTheDocument();
  });
});

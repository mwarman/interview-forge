import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';

import { NewSessionDialog } from './NewSessionDialog';

vi.mock('@/pages/jd/sessions/list/api/useCreateSession', () => ({
  useCreateSession: vi.fn(),
}));

const JD_ID = '550e8400-e29b-41d4-a716-446655440001';

const mockMutateAsync = vi.fn();

const renderDialog = (overrides: { onSuccess?: (id: string) => void; onOpenChange?: (open: boolean) => void } = {}) => {
  return renderWithAllProviders(
    <NewSessionDialog
      jdId={JD_ID}
      open={true}
      onOpenChange={overrides.onOpenChange ?? vi.fn()}
      onSuccess={overrides.onSuccess ?? vi.fn()}
    />,
  );
};

describe('NewSessionDialog', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useCreateSession } = await import('@/pages/jd/sessions/list/api/useCreateSession');
    vi.mocked(useCreateSession).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as never);
  });

  it('should render the dialog with title and description', () => {
    // Arrange & Act
    renderDialog();

    // Assert
    expect(screen.getByTestId('new-session-dialog')).toBeInTheDocument();
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByText(/candidate's name/i)).toBeInTheDocument();
  });

  it('should render the candidate name input and submit button', () => {
    // Arrange & Act
    renderDialog();

    // Assert
    expect(screen.getByTestId('candidate-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-session-submit')).toHaveTextContent('Start Session');
  });

  it('should show a validation error when submitting with empty candidate name', async () => {
    // Arrange
    const user = userEvent.setup();
    renderDialog();

    // Act
    await user.click(screen.getByTestId('new-session-submit'));

    // Assert
    expect(screen.getByTestId('candidate-name-error')).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should call mutateAsync and invoke onSuccess with sessionId on valid submission', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const newSession = {
      sessionId: '660e8400-e29b-41d4-a716-446655440001',
      jdId: JD_ID,
      candidateName: 'Jane Smith',
      status: 'PLAN_PENDING',
      createdAt: '2026-06-01T12:00:00Z',
      TTL: 9999999999,
    };
    mockMutateAsync.mockResolvedValue(newSession);
    renderDialog({ onSuccess });

    // Act
    await user.type(screen.getByTestId('candidate-name-input'), 'Jane Smith');
    await user.click(screen.getByTestId('new-session-submit'));

    // Assert
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ jdId: JD_ID, candidateName: 'Jane Smith' });
      expect(onSuccess).toHaveBeenCalledWith(newSession.sessionId);
    });
  });

  it('should clear the form and validation error when dialog is closed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    // Act - type in field then submit to trigger validation error
    await user.click(screen.getByTestId('new-session-submit'));
    expect(screen.getByTestId('candidate-name-error')).toBeInTheDocument();

    // Close via the X button (close button rendered by DialogContent)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show "Creating..." on the submit button while pending', async () => {
    // Arrange
    const { useCreateSession } = await import('@/pages/jd/sessions/list/api/useCreateSession');
    vi.mocked(useCreateSession).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as never);

    // Act
    renderDialog();

    // Assert
    expect(screen.getByTestId('new-session-submit')).toHaveTextContent('Creating...');
    expect(screen.getByTestId('new-session-submit')).toBeDisabled();
  });
});

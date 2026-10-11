import { JSX } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/common/components/shadcn/alert-dialog';

interface RemoveConfirmDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;

  /**
   * Callback to update open state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Item type being removed (e.g., "Question" or "Competency")
   */
  itemType: 'question' | 'competency';

  /**
   * Item name/description to display in confirmation message
   */
  itemName?: string;

  /**
   * Callback fired when user confirms removal
   */
  onConfirm: () => void;

  /**
   * Whether the confirm button is in a loading state
   */
  isLoading?: boolean;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * RemoveConfirmDialog component - shadcn AlertDialog for confirming item removal.
 * Used for removing questions or competencies from the plan.
 *
 * @param open - Dialog open state
 * @param onOpenChange - Callback to update open state
 * @param itemType - Item type being removed
 * @param itemName - Item name/description
 * @param onConfirm - Callback fired when user confirms removal
 * @param isLoading - Whether the confirm button is in a loading state
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The RemoveConfirmDialog component
 */
export const RemoveConfirmDialog = ({
  open,
  onOpenChange,
  itemType,
  itemName,
  onConfirm,
  isLoading = false,
  testId = 'remove-confirm-dialog',
}: RemoveConfirmDialogProps): JSX.Element => {
  const itemTypeLabel = itemType === 'question' ? 'Question' : 'Competency';
  const titleText = `Remove ${itemTypeLabel}?`;
  const descriptionText =
    itemType === 'question'
      ? `This question will be permanently removed from the plan. ${itemName ? `"${itemName}"` : ''}`
      : `This competency and all its questions will be permanently removed. ${itemName ? `"${itemName}"` : ''}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{titleText}</AlertDialogTitle>
          <AlertDialogDescription>{descriptionText}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel data-testid="confirm-cancel-button">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-remove-button"
          >
            {isLoading ? 'Removing…' : `Remove ${itemTypeLabel}`}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

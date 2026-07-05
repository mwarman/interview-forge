import { JSX } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Recommendation, RecommendationSchema } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/components/shadcn/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/shadcn/select';
import { Textarea } from '@/common/components/shadcn/textarea';
import { FieldLabel, FieldError, Field } from '@/common/components/shadcn/field';

const overrideFormSchema = z.object({
  recommendation: RecommendationSchema,
  overrideReason: z
    .string()
    .min(20, 'Override reason must be at least 20 characters')
    .max(1000, 'Override reason must not exceed 1000 characters'),
});

type OverrideFormValues = z.infer<typeof overrideFormSchema>;

interface ApproveWithOverrideDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback fired when dialog is closed
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback fired when form is submitted with override data
   */
  onConfirm: (data: { recommendation: Recommendation; overrideReason: string }) => void;

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
 * ApproveWithOverrideDialog component - modal for approving assessment with recommendation override.
 * Displays a select for recommendation and textarea for override reason (min 20 chars).
 * Uses react-hook-form with Zod validation.
 *
 * @param isOpen - Whether the dialog is open
 * @param onOpenChange - Callback fired when dialog is closed
 * @param onConfirm - Callback fired when form is submitted with override data
 * @param isLoading - Whether the confirm button is in a loading state
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The ApproveWithOverrideDialog component
 */
export const ApproveWithOverrideDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
  testId = 'approve-with-override-dialog',
}: ApproveWithOverrideDialogProps): JSX.Element => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    mode: 'onChange',
    defaultValues: {
      recommendation: undefined,
      overrideReason: '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const onSubmit = (data: OverrideFormValues) => {
    onConfirm({
      recommendation: data.recommendation,
      overrideReason: data.overrideReason,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent data-testid={testId} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve with Override</DialogTitle>
          <DialogDescription>
            Override the recommended decision with a different recommendation and provide a reason.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Controller
              name="recommendation"
              control={control}
              rules={{ required: 'Please select a recommendation' }}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="recommendation">Recommendation</FieldLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger id="recommendation" data-testid="recommendation-select">
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRONG_HIRE">STRONG HIRE</SelectItem>
                      <SelectItem value="HIRE">HIRE</SelectItem>
                      <SelectItem value="NO_HIRE">NO HIRE</SelectItem>
                      <SelectItem value="STRONG_NO_HIRE">STRONG NO HIRE</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            {errors.recommendation && <FieldError>{errors.recommendation.message}</FieldError>}
          </div>

          <div>
            <Controller
              name="overrideReason"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="override-reason">Override Reason</FieldLabel>
                  <Textarea
                    id="override-reason"
                    data-testid="override-reason-textarea"
                    placeholder="Provide at least 20 characters explaining the override"
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </Field>
              )}
            />
            {errors.overrideReason && <FieldError>{errors.overrideReason.message}</FieldError>}
          </div>
        </form>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            data-testid="confirm-override-button"
          >
            {isLoading ? 'Confirming…' : 'Confirm Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

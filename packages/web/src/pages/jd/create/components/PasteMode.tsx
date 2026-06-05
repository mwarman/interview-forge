import { JSX, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { CreateJobDescriptionRequestSchema } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Input } from '@/common/components/shadcn/input';
import { Textarea } from '@/common/components/shadcn/textarea';
import { useCreateJobDescription } from '@/pages/jd/create/api/useCreateJobDescription';
import { cn } from '@/common/utils/css';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/common/components/shadcn/field';

interface PasteModeProps {
  onSuccess?: () => void;
}

/**
 * PasteMode component - Form for inputting job description via paste mode.
 * Validates title (required, max 200 chars) and rawText (required, min 100 chars).
 * On submit, calls the API to create a job description.
 *
 * @param onSuccess - Callback function when job description is successfully created
 * @returns {JSX.Element} The PasteMode form component
 */
export const PasteMode = ({ onSuccess }: PasteModeProps): JSX.Element => {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createJdMutation = useCreateJobDescription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      // Validate using the shared schema
      const pasteRequest = CreateJobDescriptionRequestSchema.parse({
        mode: 'paste',
        title,
        rawText,
      });

      // Submit to API
      await createJdMutation.mutateAsync(pasteRequest);

      // On success, call the callback or navigate
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = String(issue.path[0]);
          errors[field] = issue.message;
        });
        setValidationErrors(errors);
      } else {
        // Handle API errors
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        toast.error(errorMessage, {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit({ preventDefault: () => {} } as React.FormEvent),
          },
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="paste-title">Title</FieldLabel>
            <Input
              id="paste-title"
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, 200));
                setValidationErrors((prev) => ({ ...prev, title: '' }));
              }}
              maxLength={200}
              disabled={createJdMutation.isPending}
              data-testid="paste-title-input"
              className={validationErrors.title ? 'border-red-500' : ''}
            />
            <FieldDescription className="flex items-center justify-between">
              <div>The title of the job description (max 200 characters).</div>
              <div className="text-xs">{title.length}/200</div>
            </FieldDescription>
            <FieldError>{validationErrors.title}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="paste-raw-text">Job Description</FieldLabel>
            <Textarea
              id="paste-raw-text"
              placeholder="Paste the job description text here (minimum 100 characters)..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setValidationErrors((prev) => ({ ...prev, rawText: '' }));
              }}
              disabled={createJdMutation.isPending}
              rows={10}
              data-testid="paste-raw-text-textarea"
              className={cn('h-60', { 'border-red-500': validationErrors.rawText })}
            />
            <FieldDescription className="flex items-center justify-between">
              <div>The text of the job description (minimum 100 characters).</div>
              <div className="text-xs">{rawText.length}/5000</div>
            </FieldDescription>
            <FieldError>{validationErrors.rawText}</FieldError>
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={createJdMutation.isPending}
              data-testid="paste-submit-button"
              className="w-full"
            >
              {createJdMutation.isPending ? 'Uploading...' : 'Create Job Description'}
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

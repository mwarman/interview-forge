import { JSX, useState } from 'react';
import { Button } from '@/common/components/shadcn/button';
import { Input } from '@/common/components/shadcn/input';
import { Textarea } from '@/common/components/shadcn/textarea';
import { useCreateJobDescription } from '../api/useCreateJobDescription';
import { CreateJobDescriptionRequestSchema } from '@interview-forge/shared';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/common/utils/css';

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
      <div>
        <label htmlFor="paste-title" className="mb-1 block text-sm font-medium">
          Title <span className="text-red-500">*</span>
        </label>
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
        <div className="mt-1 flex items-start justify-between">
          {validationErrors.title && <p className="text-sm text-red-500">{validationErrors.title}</p>}
          <p className="ml-auto text-xs text-gray-500">{title.length}/200</p>
        </div>
      </div>

      <div>
        <label htmlFor="paste-raw-text" className="mb-1 block text-sm font-medium">
          Job Description <span className="text-red-500">*</span>
        </label>
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
        <div className="mt-1 flex items-start justify-between">
          {validationErrors.rawText && <p className="text-sm text-red-500">{validationErrors.rawText}</p>}
          <p className="ml-auto text-xs text-gray-500">{rawText.length}/∞</p>
        </div>
      </div>

      <Button type="submit" disabled={createJdMutation.isPending} data-testid="paste-submit-button" className="w-full">
        {createJdMutation.isPending ? 'Uploading...' : 'Create Job Description'}
      </Button>
    </form>
  );
};

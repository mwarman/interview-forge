import { JSX, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { CreateSessionRequestSchema } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/components/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/common/components/shadcn/field';
import { Input } from '@/common/components/shadcn/input';
import { useCreateSession } from '@/pages/jd/sessions/api/useCreateSession';

interface NewSessionDialogProps {
  jdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sessionId: string) => void;
}

/**
 * NewSessionDialog component - shadcn Dialog with a form to create a new session.
 * Validates candidate name (required), calls POST /jds/:jdId/sessions on submit,
 * and invokes onSuccess with the new sessionId on successful creation.
 *
 * @param jdId - The job description identifier
 * @param open - Controlled open state
 * @param onOpenChange - Callback to update open state
 * @param onSuccess - Callback invoked with the new sessionId on success
 * @returns {JSX.Element} The NewSessionDialog component
 */
export const NewSessionDialog = ({ jdId, open, onOpenChange, onSuccess }: NewSessionDialogProps): JSX.Element => {
  const [candidateName, setCandidateName] = useState('');
  const [validationError, setValidationError] = useState('');
  const createSessionMutation = useCreateSession(jdId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    try {
      const request = CreateSessionRequestSchema.parse({ jdId, candidateName });
      const session = await createSessionMutation.mutateAsync(request);
      setCandidateName('');
      onSuccess(session.sessionId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues.find((i) => i.path[0] === 'candidateName');
        setValidationError(issue?.message ?? 'Candidate name is required');
      } else {
        const message = error instanceof Error ? error.message : 'An error occurred';
        toast.error(message);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCandidateName('');
      setValidationError('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="new-session-dialog">
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>Enter the candidate's name to start a new interview session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="new-session-form">
          <Field>
            <FieldLabel htmlFor="candidate-name">Candidate Name</FieldLabel>
            <Input
              id="candidate-name"
              type="text"
              placeholder="e.g., Jane Smith"
              value={candidateName}
              onChange={(e) => {
                setCandidateName(e.target.value);
                setValidationError('');
              }}
              disabled={createSessionMutation.isPending}
              data-testid="candidate-name-input"
              aria-invalid={!!validationError}
            />
            {validationError && <FieldError data-testid="candidate-name-error">{validationError}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={createSessionMutation.isPending} data-testid="new-session-submit">
              {createSessionMutation.isPending ? 'Creating...' : 'Start Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

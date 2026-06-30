import { JSX, useMemo, useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';

import {
  InterviewPlan,
  Competency,
  CompetencyNotesSchema,
  Scorecard,
  CompetencyNotes,
  Session,
} from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { Textarea } from '@/common/components/shadcn/textarea';
import { Badge } from '@/common/components/shadcn/badge';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/common/components/shadcn/field';
import { LikertRating } from './LikertRating';
import { useSubmitScorecard } from '../api/useSubmitScorecard';
import { Alert, AlertDescription, AlertTitle } from '@/common/components/shadcn/alert';
import { AlertCircleIcon } from 'lucide-react';
import { cn } from '@/common/utils/css';

/**
 * Form schema for scorecard - validates the array of competency scores
 */
const ScorecardFormSchema = z.object({
  competencyScores: z.array(CompetencyNotesSchema),
});

export type ScorecardFormValues = z.infer<typeof ScorecardFormSchema>;

interface ScorecardFormProps {
  session: Session;
}

/**
 * ScorecardForm component - renders the scorecard entry form with all competencies and questions.
 * Uses React Hook Form with Zod validation to manage form state for rating each question 1-5
 * and adding optional notes per competency and per question.
 *
 * @param plan - The InterviewPlan object
 * @param competencyScores - Current form state
 * @param onCompetencyScoresChange - Callback to update form state
 * @returns {JSX.Element} The ScorecardForm component
 */
export const ScorecardForm = ({ session }: ScorecardFormProps): JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { mutate: submitScorecard, isPending: submitScorecardPending } = useSubmitScorecard(
    session.jdId,
    session.sessionId,
  );

  // Initialize form state based on the competencies and questions in the plan
  const initialCompetencyScores = useMemo(() => {
    // Initialize empty form state based on plan
    const plan: InterviewPlan = session.plan as InterviewPlan;
    return plan.competencies.map((comp) => ({
      competencyId: comp.competencyId,
      overallNotes: '',
      questionRatings: comp.questions.map((q) => ({
        questionId: q.questionId,
        rating: undefined as number | undefined,
        notes: '',
      })),
    }));
  }, [session]);

  // TODO: Create a QuestionTypeBadge component to replace this function and ensure consistent styling across the app
  const getQuestionTypeColor = (type: string): string => {
    switch (type) {
      case 'BEHAVIORAL':
        return 'bg-blue-100 text-blue-800';
      case 'SITUATIONAL':
        return 'bg-amber-100 text-amber-800';
      case 'TECHNICAL':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const { control, handleSubmit, formState } = useForm<ScorecardFormValues>({
    resolver: zodResolver(ScorecardFormSchema),
    mode: 'onChange',
    defaultValues: {
      competencyScores: initialCompetencyScores,
    },
  });

  const { fields: competencyFields } = useFieldArray({
    control,
    name: 'competencyScores',
  });

  const handleFormSubmit = (data: ScorecardFormValues) => {
    // Transform form data to match API shape if needed (in this case, it already matches)
    const scorecardData: Scorecard = {
      scorecardId: uuid(),
      completedAt: new Date().toISOString(),
      competencyScores: data.competencyScores,
    };

    setError(null); // Clear any existing errors

    submitScorecard(scorecardData, {
      onError: (error) => {
        console.error('Error submitting scorecard:', error);
        toast.error(`Failed to submit scorecard: ${error?.message}`);
        setError(error.message || 'An unexpected error occurred while submitting the scorecard.');
      },
      onSuccess: () => {
        console.log('Scorecard submitted successfully');
        toast.success('Scorecard submitted successfully!');
        navigate(`/jds/${session.jdId}/sessions`);
      },
    });
  };

  return (
    <form data-testid="scorecard-form" className="space-y-8" onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Error alert */}
      <Alert variant="destructive" className={cn({ hidden: !error })} data-testid="scorecard-form-error">
        <AlertCircleIcon />
        <AlertTitle>Scorecard Submission Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>

      {/* for each Competency */}
      {competencyFields.map((competency: CompetencyNotes, compIndex: number) => {
        const plan: InterviewPlan = session.plan as InterviewPlan;
        const compDetails = plan.competencies.find((c) => c.competencyId === competency.competencyId) as Competency;
        const { fields: questions } = useFieldArray({
          control,
          name: `competencyScores.${compIndex}.questionRatings`,
        });
        return (
          <Card key={competency.competencyId} data-testid={`competency-section-${competency.competencyId}`}>
            <CardHeader>
              <CardTitle className="text-xl">{compDetails.name}</CardTitle>
              <CardDescription>{compDetails.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall competency notes */}
              <div data-testid={`overall-notes-section-${competency.competencyId}`}>
                <Controller
                  name={`competencyScores.${compIndex}.overallNotes`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Competency Notes</FieldLabel>
                      <Textarea
                        {...field}
                        placeholder="Add overall notes for this competency..."
                        data-testid={`overall-notes-textarea-${competency.competencyId}`}
                        rows={3}
                      />
                      <FieldDescription className="flex items-center justify-between">
                        <span>Optional overall notes for this competency.</span>
                        <span className="text-xs">{(field.value || '').length}/2000 characters</span>
                      </FieldDescription>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              {/* Questions */}
              <div className="space-y-4 border-t pt-4" data-testid={`questions-section-${competency.competencyId}`}>
                <h4 className="text-sm font-semibold">Questions</h4>
                {questions.map((question, questionIndex) => {
                  const questionDetails = compDetails.questions.find((q) => q.questionId === question.questionId);
                  if (!questionDetails) return null; // This should never happen, but we add this guard just in case
                  return (
                    <div
                      key={question.questionId}
                      className="bg-muted/50 space-y-3 rounded-lg p-3"
                      data-testid={`question-item-${question.questionId}`}
                    >
                      {/* Question text with type badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{questionDetails.text}</p>
                          <Badge
                            variant="outline"
                            className={`mt-2 ${getQuestionTypeColor(questionDetails.type)}`}
                            data-testid={`question-type-badge-${question.questionId}`}
                          >
                            {questionDetails.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Rating control */}
                      <div data-testid={`rating-control-${question.questionId}`}>
                        <Controller
                          name={`competencyScores.${compIndex}.questionRatings.${questionIndex}.rating`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Rating (Required)</FieldLabel>
                              <LikertRating
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                data-testid={`likert-rating-${question.questionId}`}
                              />
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      {/* Question-level notes */}
                      <div>
                        <Controller
                          name={`competencyScores.${compIndex}.questionRatings.${questionIndex}.notes`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Notes</FieldLabel>
                              <Textarea
                                {...field}
                                placeholder="Optional notes for this question..."
                                data-testid={`question-notes-textarea-${question.questionId}`}
                                rows={3}
                              />
                              <FieldDescription className="flex items-center justify-between">
                                <span>Optional notes for this question.</span>
                                <span className="text-xs">{(field.value || '').length}/1000 characters</span>
                              </FieldDescription>
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Form buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitScorecardPending || formState.isValid === false}
          data-testid="submit-scorecard-button"
        >
          {submitScorecardPending ? 'Submitting...' : 'Submit Scorecard'}
        </Button>
      </div>
    </form>
  );
};

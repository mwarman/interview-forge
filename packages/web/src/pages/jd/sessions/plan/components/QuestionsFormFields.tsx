import { useState } from 'react';
import { Control, Controller, useFieldArray } from 'react-hook-form';
import { TrashIcon } from 'lucide-react';

import { PlanFormValues } from './PlanReadyState';
import { Textarea } from '@/common/components/shadcn/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/shadcn/select';
import { Field, FieldLabel, FieldError } from '@/common/components/shadcn/field';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { Button } from '@/common/components/shadcn/button';
import { RemoveConfirmDialog } from './RemoveConfirmDialog';

/**
 * Props for the QuestionsFormFields component, which renders the form fields for managing interview questions
 * within a competency. It includes the react-hook-form control object and the index of the competency being edited.
 */
export interface QuestionsFormFieldsProps {
  control: Control<PlanFormValues>;
  competencyIndex: number;
}

/**
 * The QuestionsFormFields component renders the form fields for managing interview questions within
 * a competency. It allows users to define the question text, type, and an optional follow-up prompt
 * for each question. Users can also remove questions, with a confirmation dialog to prevent
 * accidental deletions.
 * @param props - The props for the QuestionsFormFields component, including the react-hook-form control and competency index.
 * @param props.control - The react-hook-form control object for managing form state and validation.
 * @param props.competencyIndex - The index of the competency for which the interview questions are being managed.
 * @returns A JSX element representing the form fields for managing interview questions within a competency.
 */
export const QuestionsFormFields = ({ control, competencyIndex }: QuestionsFormFieldsProps) => {
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeQuestionIndex, setRemoveQuestionIndex] = useState(0);

  const { fields: questions, remove: removeQuestion } = useFieldArray({
    control,
    name: `competencies.${competencyIndex}.questions`,
  });

  const handleOpenRemoveConfirm = (questionIndex: number) => {
    setRemoveQuestionIndex(questionIndex);
    setRemoveConfirmOpen(true);
  };

  const handleRemoveQuestion = (questionIndex: number) => {
    removeQuestion(questionIndex);
    setRemoveConfirmOpen(false);
  };

  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle>Interview Questions</CardTitle>
        <CardDescription>
          Define the interview questions for this competency. At least one question is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {questions.map((question, questionIndex) => (
          <Card key={question.questionId} data-testid={`question-card-${competencyIndex}-${questionIndex}`}>
            <CardHeader>
              <CardTitle className="text-sm">Question {questionIndex + 1}</CardTitle>
              <CardDescription>Define the question text, type, and optional follow-up prompt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Controller
                control={control}
                name={`competencies.${competencyIndex}.questions.${questionIndex}.text`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`question-text-${competencyIndex}-${questionIndex}`}>Question</FieldLabel>
                    <Textarea
                      {...field}
                      id={`question-text-${competencyIndex}-${questionIndex}`}
                      placeholder="Enter the interview question…"
                      data-testid={`question-text-input-${competencyIndex}-${questionIndex}`}
                      rows={3}
                      aria-invalid={!!fieldState.error}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name={`competencies.${competencyIndex}.questions.${questionIndex}.type`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`question-type-${competencyIndex}-${questionIndex}`}>Type</FieldLabel>
                    <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`question-type-${competencyIndex}-${questionIndex}`}
                        aria-invalid={!!fieldState.error}
                        data-testid={`question-type-select-${competencyIndex}-${questionIndex}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                        <SelectItem value="SITUATIONAL">Situational</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name={`competencies.${competencyIndex}.questions.${questionIndex}.followUpPrompt`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`question-followup-${competencyIndex}-${questionIndex}`}>
                      Follow-up Prompt (Optional)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={`question-followup-${competencyIndex}-${questionIndex}`}
                      placeholder="Optional follow-up prompt…"
                      data-testid={`question-followup-input-${competencyIndex}-${questionIndex}`}
                      rows={2}
                      aria-invalid={!!fieldState.error}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleOpenRemoveConfirm(questionIndex);
                }}
                data-testid={`remove-question-button-${competencyIndex}-${questionIndex}`}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
        <RemoveConfirmDialog
          open={removeConfirmOpen}
          onOpenChange={setRemoveConfirmOpen}
          itemType={'question'}
          itemName={questions[removeQuestionIndex].text}
          onConfirm={() => handleRemoveQuestion(removeQuestionIndex)}
        />
      </CardContent>
    </Card>
  );
};

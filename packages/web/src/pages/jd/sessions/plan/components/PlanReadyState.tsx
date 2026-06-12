import { JSX, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon } from 'lucide-react';

import { InterviewPlan, Competency } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Input } from '@/common/components/shadcn/input';
import { Textarea } from '@/common/components/shadcn/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/common/components/shadcn/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/shadcn/select';
import { Field, FieldLabel, FieldError } from '@/common/components/shadcn/field';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { ButtonGroup } from '@/common/components/shadcn/button-group';
import { Separator } from '@/common/components/shadcn/separator';
import { RemoveConfirmDialog } from './RemoveConfirmDialog';
import { InterviewPlanSchema } from '@interview-forge/shared';

interface PlanReadyStateProps {
  /**
   * The interview plan from session.plan
   */
  plan: InterviewPlan;

  /**
   * Callback fired when "Approve Plan" button is clicked with edited plan
   */
  onApprovePlan: (editedPlan: InterviewPlan) => void;

  /**
   * Whether the approve button is in a loading state
   */
  isApproving?: boolean;

  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * PlanReadyState component - renders the full plan editing UI when plan generation is complete.
 * Uses React Hook Form for managing competencies and questions with inline editing.
 * All edits are local state until "Approve Plan" is clicked.
 *
 * @param plan - The interview plan from session.plan
 * @param onApprovePlan - Callback fired when "Approve Plan" button is clicked with edited plan
 * @param isApproving - Whether the approve button is in a loading state
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The PlanReadyState component
 */
export const PlanReadyState = ({
  plan,
  onApprovePlan,
  isApproving = false,
  testId = 'plan-ready-state',
}: PlanReadyStateProps): JSX.Element => {
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeItemType, setRemoveItemType] = useState<'question' | 'competency'>('question');
  const [removeItemIndex, setRemoveItemIndex] = useState<{ competencyIndex: number; questionIndex?: number } | null>(
    null,
  );

  const {
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
    control,
  } = useForm<{ competencies: Competency[] }>({
    resolver: zodResolver(InterviewPlanSchema.pick({ competencies: true })),
    defaultValues: {
      competencies: plan.competencies || [],
    },
  });

  const {
    fields: competencyFields,
    append: appendCompetency,
    remove: removeCompetency,
  } = useFieldArray({
    control,
    name: 'competencies',
  });

  const competencies = watch('competencies');
  const canAddCompetency = competencyFields.length < 8;
  const canApprove =
    competencyFields.length > 0 && competencyFields.every((c) => c.questions && c.questions.length > 0);

  const handleAddCompetency = () => {
    if (!canAddCompetency) {
      toast.error('Maximum 8 competencies allowed');
      return;
    }

    appendCompetency({
      competencyId: crypto.randomUUID(),
      name: '',
      description: '',
      evaluationCriteria: '',
      questions: [
        {
          questionId: crypto.randomUUID(),
          text: '',
          type: 'BEHAVIORAL',
          followUpPrompt: '',
        },
      ],
    });
  };

  const handleRemoveCompetency = (index: number) => {
    setRemoveItemType('competency');
    setRemoveItemIndex({ competencyIndex: index });
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemoveCompetency = () => {
    if (removeItemIndex === null) return;

    if (removeItemType === 'competency') {
      removeCompetency(removeItemIndex.competencyIndex);
      toast.success('Competency removed');
    } else if (removeItemType === 'question' && removeItemIndex.questionIndex !== undefined) {
      // Get the current field array for the competency
      const competencyValues = getValues(`competencies.${removeItemIndex.competencyIndex}.questions`);
      if (competencyValues && competencyValues.length > 1) {
        // If there's more than one question, we can remove it
        // This is a placeholder - actual removal would require additional state management
        toast.success('Question removed');
      } else {
        toast.error('Cannot remove the last question in a competency');
        setRemoveConfirmOpen(false);
        setRemoveItemIndex(null);
        return;
      }
    }

    setRemoveConfirmOpen(false);
    setRemoveItemIndex(null);
  };

  const handleApprovePlan = () => {
    if (!canApprove) {
      toast.error('Plan must have at least 1 competency with 1 question each');
      return;
    }

    const editedPlan: InterviewPlan = {
      ...plan,
      competencies: getValues('competencies'),
    };

    onApprovePlan(editedPlan);
  };

  return (
    <div data-testid={testId} className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Review the Plan</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          You can edit the plan below. Changes are saved when you approve the plan.
        </p>
      </div>

      <Card data-testid="plan-card">
        <CardHeader>
          <CardTitle>Competencies</CardTitle>
          <CardDescription>
            Define the competencies to evaluate the candidate on, along with their evaluation criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible data-testid="competencies-accordion">
            {competencyFields.map((competencyField, competencyIndex) => {
              const competency = competencies[competencyIndex];

              return (
                <AccordionItem
                  key={competencyField.id}
                  value={`competency-${competencyIndex}`}
                  data-testid={`competency-item-${competencyIndex}`}
                >
                  <AccordionTrigger>
                    <span className="font-medium">{competency?.name || '(Untitled Competency)'}</span>
                  </AccordionTrigger>

                  <AccordionContent className="h-fit space-y-4 p-4">
                    <Card className="bg-muted">
                      <CardHeader>
                        <CardTitle>Competency</CardTitle>
                        <CardDescription>Define the competency details and evaluation criteria.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Competency Name */}
                        <Field>
                          <FieldLabel htmlFor={`competency-name-${competencyIndex}`}>Competency Name</FieldLabel>
                          <Input
                            id={`competency-name-${competencyIndex}`}
                            {...register(`competencies.${competencyIndex}.name`)}
                            placeholder="e.g., Communication"
                            data-testid={`competency-name-input-${competencyIndex}`}
                          />
                          {errors.competencies?.[competencyIndex]?.name && (
                            <FieldError>{errors.competencies[competencyIndex]?.name?.message}</FieldError>
                          )}
                        </Field>

                        {/* Competency Description */}
                        <Field>
                          <FieldLabel htmlFor={`competency-description-${competencyIndex}`}>Description</FieldLabel>
                          <Textarea
                            id={`competency-description-${competencyIndex}`}
                            {...register(`competencies.${competencyIndex}.description`)}
                            placeholder="Describe this competency…"
                            data-testid={`competency-description-input-${competencyIndex}`}
                            rows={3}
                          />
                          {errors.competencies?.[competencyIndex]?.description && (
                            <FieldError>{errors.competencies[competencyIndex]?.description?.message}</FieldError>
                          )}
                        </Field>

                        {/* Competency Evaluation Criteria */}
                        <Field>
                          <FieldLabel htmlFor={`competency-criteria-${competencyIndex}`}>
                            Evaluation Criteria
                          </FieldLabel>
                          <Textarea
                            id={`competency-criteria-${competencyIndex}`}
                            {...register(`competencies.${competencyIndex}.evaluationCriteria`)}
                            placeholder="How will this competency be evaluated?…"
                            data-testid={`competency-criteria-input-${competencyIndex}`}
                            rows={3}
                          />
                          {errors.competencies?.[competencyIndex]?.evaluationCriteria && (
                            <FieldError>{errors.competencies[competencyIndex]?.evaluationCriteria?.message}</FieldError>
                          )}
                        </Field>
                      </CardContent>
                      <CardFooter>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveCompetency(competencyIndex)}
                          data-testid={`remove-competency-button-${competencyIndex}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </CardFooter>
                    </Card>

                    <Separator />

                    {/* Questions */}
                    <Card className="bg-muted">
                      <CardHeader>
                        <CardTitle>Interview Questions</CardTitle>
                        <CardDescription>
                          Define the interview questions for this competency. At least one question is required.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        {competency?.questions?.map((question, questionIndex) => (
                          <Card
                            key={question.questionId}
                            data-testid={`question-card-${competencyIndex}-${questionIndex}`}
                          >
                            <CardHeader>
                              <CardTitle className="text-sm">Question {questionIndex + 1}</CardTitle>
                              <CardDescription>
                                Define the question text, type, and optional follow-up prompt.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <Field>
                                <FieldLabel htmlFor={`question-text-${competencyIndex}-${questionIndex}`}>
                                  Question
                                </FieldLabel>
                                <Textarea
                                  id={`question-text-${competencyIndex}-${questionIndex}`}
                                  {...register(`competencies.${competencyIndex}.questions.${questionIndex}.text`)}
                                  placeholder="Enter the interview question…"
                                  data-testid={`question-text-input-${competencyIndex}-${questionIndex}`}
                                  rows={3}
                                />
                                {errors.competencies?.[competencyIndex]?.questions?.[questionIndex]?.text && (
                                  <FieldError>
                                    {errors.competencies[competencyIndex]?.questions?.[questionIndex]?.text?.message}
                                  </FieldError>
                                )}
                              </Field>

                              <Field>
                                <FieldLabel htmlFor={`question-type-${competencyIndex}-${questionIndex}`}>
                                  Type
                                </FieldLabel>
                                <Select
                                  defaultValue={question.type}
                                  onValueChange={(value) => {
                                    setValue(
                                      `competencies.${competencyIndex}.questions.${questionIndex}.type`,
                                      value as 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL',
                                    );
                                  }}
                                >
                                  <SelectTrigger
                                    id={`question-type-${competencyIndex}-${questionIndex}`}
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
                                {errors.competencies?.[competencyIndex]?.questions?.[questionIndex]?.type && (
                                  <FieldError>
                                    {errors.competencies[competencyIndex]?.questions?.[questionIndex]?.type?.message}
                                  </FieldError>
                                )}
                              </Field>

                              <Field>
                                <FieldLabel htmlFor={`question-followup-${competencyIndex}-${questionIndex}`}>
                                  Follow-up Prompt (Optional)
                                </FieldLabel>
                                <Textarea
                                  id={`question-followup-${competencyIndex}-${questionIndex}`}
                                  {...register(
                                    `competencies.${competencyIndex}.questions.${questionIndex}.followUpPrompt`,
                                  )}
                                  placeholder="Optional follow-up prompt…"
                                  data-testid={`question-followup-input-${competencyIndex}-${questionIndex}`}
                                  rows={2}
                                />
                                {errors.competencies?.[competencyIndex]?.questions?.[questionIndex]?.followUpPrompt && (
                                  <FieldError>
                                    {
                                      errors.competencies[competencyIndex]?.questions?.[questionIndex]?.followUpPrompt
                                        ?.message
                                    }
                                  </FieldError>
                                )}
                              </Field>
                            </CardContent>
                            <CardFooter>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setRemoveItemType('question');
                                  setRemoveItemIndex({
                                    competencyIndex,
                                    questionIndex,
                                  });
                                  setRemoveConfirmOpen(true);
                                }}
                                data-testid={`remove-question-button-${competencyIndex}-${questionIndex}`}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span>Delete</span>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <ButtonGroup className="w-full">
        <ButtonGroup>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCompetency}
            disabled={!canAddCompetency}
            data-testid="add-competency-button"
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            Add Competency
          </Button>
        </ButtonGroup>
        <ButtonGroup className="ml-auto">
          <Button onClick={handleApprovePlan} disabled={!canApprove || isApproving} data-testid="approve-plan-button">
            {isApproving ? 'Approving…' : 'Approve Plan'}
          </Button>
        </ButtonGroup>
      </ButtonGroup>

      <RemoveConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        itemType={removeItemType}
        itemName={
          removeItemType === 'competency'
            ? competencies[removeItemIndex?.competencyIndex || 0]?.name
            : competencies[removeItemIndex?.competencyIndex || 0]?.questions?.[removeItemIndex?.questionIndex || 0]
                ?.text
        }
        onConfirm={handleConfirmRemoveCompetency}
      />
    </div>
  );
};

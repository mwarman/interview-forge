import { JSX, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon } from 'lucide-react';

import { InterviewPlan, InterviewPlanSchema, Competency } from '@interview-forge/shared';
import { Button } from '@/common/components/shadcn/button';
import { Input } from '@/common/components/shadcn/input';
import { Textarea } from '@/common/components/shadcn/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/common/components/shadcn/accordion';
import { Field, FieldLabel, FieldError } from '@/common/components/shadcn/field';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/common/components/shadcn/card';
import { ButtonGroup } from '@/common/components/shadcn/button-group';
import { Separator } from '@/common/components/shadcn/separator';
import { RemoveConfirmDialog } from './RemoveConfirmDialog';
import { QuestionsFormFields } from './QuestionsFormFields';

/**
 * Plan form values type - defines the shape of the form data for editing the interview plan
 */
export type PlanFormValues = {
  competencies: Competency[];
};

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
  const [removeCompetencyIndex, setRemoveCompetencyIndex] = useState<number | null>(null);

  const { control, handleSubmit } = useForm<PlanFormValues>({
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
    setRemoveCompetencyIndex(index);
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemoveCompetency = () => {
    if (removeCompetencyIndex === null) return;

    removeCompetency(removeCompetencyIndex);
    toast.success('Competency removed');

    setRemoveConfirmOpen(false);
    setRemoveCompetencyIndex(null);
  };

  const handleApprovePlan = (data: PlanFormValues) => {
    if (!canApprove) {
      toast.error('Plan must have at least 1 competency with 1 question each');
      return;
    }

    const editedPlan: InterviewPlan = {
      ...plan,
      competencies: data.competencies,
    };

    onApprovePlan(editedPlan);
  };

  return (
    <div data-testid={testId} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Review the Plan</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          You can edit the plan below. Changes are saved when you approve the plan.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleApprovePlan)} className="space-y-6">
        <Card data-testid="plan-card">
          <CardHeader>
            <CardTitle>Competencies</CardTitle>
            <CardDescription>
              Define the competencies to evaluate the candidate on, along with their evaluation criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible data-testid="competencies-accordion">
              {competencyFields.map((competency, competencyIndex) => (
                <AccordionItem
                  key={competency.id}
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
                        <Controller
                          control={control}
                          name={`competencies.${competencyIndex}.name`}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel htmlFor={`competency-name-${competencyIndex}`}>Competency Name</FieldLabel>
                              <Input
                                {...field}
                                id={`competency-name-${competencyIndex}`}
                                placeholder="e.g., Communication"
                                data-testid={`competency-name-input-${competencyIndex}`}
                                aria-invalid={!!fieldState.error}
                              />
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        {/* Competency Description */}
                        <Controller
                          control={control}
                          name={`competencies.${competencyIndex}.description`}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel htmlFor={`competency-description-${competencyIndex}`}>Description</FieldLabel>
                              <Textarea
                                {...field}
                                id={`competency-description-${competencyIndex}`}
                                placeholder="Describe this competency…"
                                data-testid={`competency-description-input-${competencyIndex}`}
                                rows={3}
                                aria-invalid={!!fieldState.error}
                              />
                              {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        {/* Competency Evaluation Criteria */}
                        <Controller
                          control={control}
                          name={`competencies.${competencyIndex}.evaluationCriteria`}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel htmlFor={`competency-criteria-${competencyIndex}`}>
                                Evaluation Criteria
                              </FieldLabel>
                              <Textarea
                                {...field}
                                id={`competency-criteria-${competencyIndex}`}
                                placeholder="How will this competency be evaluated?…"
                                data-testid={`competency-criteria-input-${competencyIndex}`}
                                rows={3}
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
                    <QuestionsFormFields control={control} competencyIndex={competencyIndex} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <ButtonGroup className="w-full">
          <ButtonGroup>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCompetency}
              disabled={!canAddCompetency || isApproving}
              data-testid="add-competency-button"
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Competency
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-auto">
            <Button type="submit" disabled={!canApprove || isApproving} data-testid="approve-plan-button">
              {isApproving ? 'Approving…' : 'Approve Plan'}
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </form>

      <RemoveConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        itemType={'competency'}
        itemName={competencyFields[removeCompetencyIndex || 0]?.name}
        onConfirm={handleConfirmRemoveCompetency}
      />
    </div>
  );
};

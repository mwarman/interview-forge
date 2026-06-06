import { z } from 'zod';

/**
 * QuestionTypeSchema - Zod enum for question classification
 * Supports behavioral, situational, and technical question types
 */
export const QuestionTypeSchema = z.enum(['BEHAVIORAL', 'SITUATIONAL', 'TECHNICAL']).meta({
  description: 'Type of the interview question (behavioral, situational, technical)',
});

/**
 * QuestionType - TypeScript type inferred from QuestionTypeSchema
 */
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * QuestionSchema - Zod schema for Interview Question entity
 * Validates question attributes: questionId, text, type, and optional follow-up prompt
 */
export const QuestionSchema = z.object({
  questionId: z.uuid('questionId must be a valid UUID').meta({ description: 'Unique identifier for the question' }),
  text: z.string().min(1, 'Question text is required').meta({ description: 'Text of the question' }),
  type: QuestionTypeSchema,
  followUpPrompt: z.string().optional().meta({ description: 'Optional follow-up prompt for the question' }),
});

/**
 * Question - TypeScript type inferred from QuestionSchema
 */
export type Question = z.infer<typeof QuestionSchema>;

/**
 * CompetencySchema - Zod schema for Competency entity
 * Validates competency attributes: competencyId, name, description, evaluationCriteria, and questions array
 * Requires at least one question per competency
 */
export const CompetencySchema = z.object({
  competencyId: z
    .uuid('competencyId must be a valid UUID')
    .meta({ description: 'Unique identifier for the competency' }),
  name: z.string().min(1, 'Competency name is required').meta({ description: 'Name of the competency' }),
  description: z
    .string()
    .min(1, 'Competency description is required')
    .meta({ description: 'Description of the competency' }),
  evaluationCriteria: z
    .string()
    .min(1, 'Evaluation criteria is required')
    .meta({ description: 'Criteria for evaluating the competency' }),
  questions: z
    .array(QuestionSchema)
    .min(1, 'At least one question is required per competency')
    .meta({ description: 'Array of questions for the competency' }),
});

/**
 * Competency - TypeScript type inferred from CompetencySchema
 */
export type Competency = z.infer<typeof CompetencySchema>;

/**
 * InterviewPlanSchema - Zod schema for Interview Plan entity
 * Validates plan attributes: planId, competencies array (min 1, max 8), and generated timestamp
 * Max 8 competencies reflects structured interviewing best practices
 */
export const InterviewPlanSchema = z.object({
  planId: z.uuid('planId must be a valid UUID').meta({ description: 'Unique identifier for the interview plan' }),
  competencies: z
    .array(CompetencySchema)
    .min(1, 'At least one competency is required')
    .max(8, 'Maximum 8 competencies allowed')
    .meta({ description: 'Array of competencies for the interview plan' }),
  generatedAt: z.iso
    .datetime('generatedAt must be a valid ISO 8601 datetime')
    .meta({ description: 'Timestamp when the interview plan was generated' }),
});

/**
 * InterviewPlan - TypeScript type inferred from InterviewPlanSchema
 */
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

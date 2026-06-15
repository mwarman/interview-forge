import { z } from 'zod';

/**
 * QuestionRatingSchema - Zod schema for question rating entity
 * Validates rating attributes: questionId, Likert scale rating (1-5), and optional notes
 * Enforces max 1000 character limit on notes
 */
export const QuestionRatingSchema = z.object({
  questionId: z
    .string('questionId must be a valid UUID')
    .min(1, 'questionId is required')
    .meta({ description: 'UUID v4 RFC 9562/4122 unique identifier for the question' }),
  rating: z
    .number()
    .int('rating must be an integer')
    .min(1, 'rating must be between 1 and 5')
    .max(5, 'rating must be between 1 and 5')
    .meta({ description: 'Likert scale rating (1-5)' }),
  notes: z
    .string()
    .max(1000, 'notes must not exceed 1000 characters')
    .optional()
    .meta({ description: 'Optional notes for the question rating (max 1000 characters)' }),
});

/**
 * QuestionRating - TypeScript type inferred from QuestionRatingSchema
 */
export type QuestionRating = z.infer<typeof QuestionRatingSchema>;

/**
 * CompetencyNotesSchema - Zod schema for competency scorecard entity
 * Validates competency attributes: competencyId, optional overall notes, and question ratings array
 * Enforces at least one question rating per competency
 * Enforces max 2000 character limit on overall notes
 */
export const CompetencyNotesSchema = z.object({
  competencyId: z
    .string('competencyId must be a valid UUID')
    .min(1, 'competencyId is required')
    .meta({ description: 'UUID v4 RFC 9562/4122 unique identifier for the competency' }),
  overallNotes: z
    .string()
    .max(2000, 'overallNotes must not exceed 2000 characters')
    .optional()
    .meta({ description: 'Optional overall notes for the competency (max 2000 characters)' }),
  questionRatings: z
    .array(QuestionRatingSchema)
    .min(1, 'At least one question rating is required per competency')
    .meta({ description: 'Array of question ratings for the competency' }),
});

/**
 * CompetencyNotes - TypeScript type inferred from CompetencyNotesSchema
 */
export type CompetencyNotes = z.infer<typeof CompetencyNotesSchema>;

/**
 * ScorecardSchema - Zod schema for Scorecard entity
 * Validates scorecard attributes: scorecardId, completion timestamp, and competency scores array
 * Requires at least one competency score
 */
export const ScorecardSchema = z.object({
  scorecardId: z
    .string('scorecardId must be a valid UUID')
    .min(1, 'scorecardId is required')
    .meta({ description: 'UUID v4 RFC 9562/4122 unique identifier for the scorecard' }),
  completedAt: z.iso
    .datetime('completedAt must be a valid ISO 8601 datetime')
    .meta({ description: 'Timestamp when the scorecard was completed' }),
  competencyScores: z
    .array(CompetencyNotesSchema)
    .min(1, 'At least one competency score is required')
    .meta({ description: 'Array of competency scores for the scorecard' }),
});

/**
 * Scorecard - TypeScript type inferred from ScorecardSchema
 */
export type Scorecard = z.infer<typeof ScorecardSchema>;

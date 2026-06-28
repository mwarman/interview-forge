import { z } from 'zod';

/**
 * RecommendationSchema - Zod enum for hiring recommendation
 * Supports HIRE, NO_HIRE, STRONG_HIRE, and STRONG_NO_HIRE recommendation types
 */
export const RecommendationSchema = z.enum(['HIRE', 'NO_HIRE', 'STRONG_HIRE', 'STRONG_NO_HIRE']).meta({
  description: 'Hiring recommendation based on assessment (HIRE, NO_HIRE, STRONG_HIRE, STRONG_NO_HIRE)',
});

/**
 * Recommendation - TypeScript type inferred from RecommendationSchema
 */
export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * ConfidenceSchema - Zod enum for confidence level in assessment
 * Supports HIGH, MEDIUM, and LOW confidence levels
 */
export const ConfidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']).meta({
  description: 'Confidence level in the assessment (HIGH, MEDIUM, LOW)',
});

/**
 * Confidence - TypeScript type inferred from ConfidenceSchema
 */
export type Confidence = z.infer<typeof ConfidenceSchema>;

/**
 * CompetencyAssessmentSchema - Zod schema for per-competency assessment entity
 * Validates competency assessment attributes: competencyId, name, strengths, concerns, and conflicts identified
 */
export const CompetencyAssessmentSchema = z.object({
  competencyId: z
    .string('competencyId must be a valid UUID')
    .min(1, 'competencyId is required')
    .meta({ description: 'UUID v4 RFC 9562/4122 unique identifier for the competency' }),
  name: z.string().min(1, 'Competency name is required').meta({ description: 'Name of the competency' }),
  strengths: z
    .string()
    .min(1, 'Competency strengths are required')
    .meta({ description: 'Identified strengths for this competency' }),
  concerns: z
    .string()
    .min(1, 'Competency concerns are required')
    .meta({ description: 'Identified concerns for this competency' }),
  conflictsIdentified: z
    .array(z.string().min(1, 'Conflict description cannot be empty'))
    .meta({ description: 'Array of identified signal conflicts for this competency' }),
});

/**
 * CompetencyAssessment - TypeScript type inferred from CompetencyAssessmentSchema
 */
export type CompetencyAssessment = z.infer<typeof CompetencyAssessmentSchema>;

/**
 * AssessmentSchema - Zod schema for Assessment entity
 * Validates assessment attributes: assessmentId, recommendation, confidence, reasoning, competency assessments, generation timestamp, and optional override reason
 * Requires minimum 100 character reasoning and at least one competency assessment
 * overrideReason is optional and can be added when approving an assessment with manual override
 */
export const AssessmentSchema = z.object({
  assessmentId: z
    .string('assessmentId must be a valid UUID')
    .min(1, 'assessmentId is required')
    .meta({ description: 'UUID v4 RFC 9562/4122 unique identifier for the assessment' }),
  recommendation: RecommendationSchema,
  confidence: ConfidenceSchema,
  reasoning: z
    .string()
    .min(100, 'Reasoning must be at least 100 characters')
    .meta({ description: 'Supporting narrative explaining the assessment and recommendation' }),
  competencyAssessments: z
    .array(CompetencyAssessmentSchema)
    .min(1, 'At least one competency assessment is required')
    .meta({ description: 'Array of per-competency assessments' }),
  generatedAt: z.iso.datetime('generatedAt must be a valid ISO 8601 datetime').meta({
    description: 'Timestamp when the assessment was generated',
  }),
  overrideReason: z
    .string()
    .optional()
    .meta({ description: 'Optional reason provided when manually overriding the assessment recommendation' }),
});

/**
 * Assessment - TypeScript type inferred from AssessmentSchema
 */
export type Assessment = z.infer<typeof AssessmentSchema>;

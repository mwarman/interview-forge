import { z } from 'zod';

import { InterviewPlanSchema } from './interview-plan';

/**
 * SessionStatus - Zod enum for Session lifecycle states
 */
export const SessionStatusSchema = z.enum([
  'PLAN_GENERATING',
  'PLAN_ERROR',
  'PLAN_PENDING',
  'PLAN_GENERATED',
  'PLAN_APPROVED',
  'SCORED',
  'ASSESS_GENERATING',
  'ASSESS_ERROR',
  'ASSESSED',
  'COMPLETE',
]);

/**
 * SessionStatus - TypeScript type inferred from SessionStatusSchema
 */
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * SessionSchema - Zod schema for Session entity
 * Validates all session attributes: sessionId, jdId, candidateName, status, and optional structured data
 * Map stubs (plan, scorecard, assessment) are typed as optional records for future deepening in M3-M5
 */
export const SessionSchema = z.object({
  sessionId: z.uuid('sessionId must be a valid UUID'),
  jdId: z.uuid('jdId must be a valid UUID'),
  candidateName: z.string().min(1, 'candidateName is required'),
  status: SessionStatusSchema,
  plan: z.record(z.string(), z.unknown()).optional(),
  planErrorMessage: z.string().optional(),
  scorecard: z.record(z.string(), z.unknown()).optional(),
  assessment: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.iso.datetime('createdAt must be a valid ISO 8601 datetime'),
  TTL: z.number().int().positive('TTL must be a positive integer'),
});

/**
 * Session - TypeScript type inferred from SessionSchema
 */
export type Session = z.infer<typeof SessionSchema>;

/**
 * CreateSessionRequestSchema - Zod schema for create session request
 * Accepts jdId and candidateName to create a new session under a parent JD
 */
export const CreateSessionRequestSchema = z.object({
  jdId: z.uuid('jdId must be a valid UUID'),
  candidateName: z.string().min(1, 'candidateName is required'),
});

/**
 * CreateSessionRequest - TypeScript type inferred from CreateSessionRequestSchema
 */
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

/**
 * ApprovePlanRequestSchema - Zod schema for approve plan request
 * Accepts an optional modified plan to replace the current session plan
 * Plan validation is included inline to validate in a single pass
 */
export const ApprovePlanRequestSchema = z.object({
  plan: InterviewPlanSchema.optional(),
});

/**
 * ApprovePlanRequest - TypeScript type inferred from ApprovePlanRequestSchema
 */
export type ApprovePlanRequest = z.infer<typeof ApprovePlanRequestSchema>;

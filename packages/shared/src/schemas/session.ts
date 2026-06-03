import { z } from 'zod';

/**
 * SessionStatus - Zod enum for Session lifecycle states
 */
export const SessionStatusSchema = z.enum(['PLAN_PENDING', 'PLAN_APPROVED', 'SCORED', 'ASSESSED', 'COMPLETE']);

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
  scorecard: z.record(z.string(), z.unknown()).optional(),
  assessment: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.iso.datetime('createdAt must be a valid ISO 8601 datetime'),
  TTL: z.number().int().positive('TTL must be a positive integer'),
});

/**
 * Session - TypeScript type inferred from SessionSchema
 */
export type Session = z.infer<typeof SessionSchema>;

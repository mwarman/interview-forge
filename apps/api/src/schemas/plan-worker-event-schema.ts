import { z } from 'zod';

/**
 * Schema for validating the plan-worker Lambda event payload
 * Expects: { jdId: string, sessionId: string }
 */
export const planWorkerEventSchema = z.object({
  jdId: z.uuid('jdId must be a valid UUID'),
  sessionId: z.uuid('sessionId must be a valid UUID'),
});

/**
 * Type for the validated plan-worker event
 */
export type PlanWorkerEvent = z.infer<typeof planWorkerEventSchema>;

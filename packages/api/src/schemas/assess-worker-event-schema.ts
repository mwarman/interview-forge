import { z } from 'zod';

/**
 * Schema for validating the assess-worker Lambda event payload
 * Expects: { jdId: string, sessionId: string }
 */
export const assessWorkerEventSchema = z.object({
  jdId: z.uuid('jdId must be a valid UUID'),
  sessionId: z.uuid('sessionId must be a valid UUID'),
});

/**
 * Type for the validated assess-worker event
 */
export type AssessWorkerEvent = z.infer<typeof assessWorkerEventSchema>;

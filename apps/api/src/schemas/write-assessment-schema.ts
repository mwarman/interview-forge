/**
 * Zod schema for the arguments of the write-assessment tool (AgentCore gateway target).
 *
 * The gateway passes the tool input as a flat event object:
 * {
 *   sessionId: '550e8400-e29b-41d4-a716-446655440000',
 *   jdId: '550e8400-e29b-41d4-a716-446655440001',
 *   assessment: '{"...": "..."}'
 * }
 *
 * The assessment argument is a non-empty JSON string, parsed and validated against the shared schema by the handler.
 */
import { z } from 'zod';

/**
 * Schema for validating the write-assessment tool arguments
 */
export const writeAssessmentArgsSchema = z.object({
  sessionId: z.string().min(1, 'sessionId cannot be empty'),
  jdId: z.string().min(1, 'jdId cannot be empty'),
  assessment: z.string().min(1, 'assessment cannot be empty'),
});

/**
 * Tool arguments type for the write-assessment tool, inferred from the Zod schema.
 */
export type WriteAssessmentArgs = z.infer<typeof writeAssessmentArgsSchema>;

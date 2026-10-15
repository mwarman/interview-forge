/**
 * Zod schema for the arguments of the write-plan tool (AgentCore gateway target).
 *
 * The gateway passes the tool input as a flat event object:
 * {
 *   sessionId: '550e8400-e29b-41d4-a716-446655440000',
 *   jdId: '550e8400-e29b-41d4-a716-446655440001',
 *   plan: '{"...": "..."}'
 * }
 *
 * The plan argument is a non-empty JSON string, parsed and validated against the shared schema by the handler.
 */
import { z } from 'zod';

/**
 * Schema for validating the write-plan tool arguments
 */
export const writePlanArgsSchema = z.object({
  sessionId: z.string().min(1, 'sessionId cannot be empty'),
  jdId: z.string().min(1, 'jdId cannot be empty'),
  plan: z.string().min(1, 'plan cannot be empty'),
});

/**
 * Tool arguments type for the write-plan tool, inferred from the Zod schema.
 */
export type WritePlanArgs = z.infer<typeof writePlanArgsSchema>;

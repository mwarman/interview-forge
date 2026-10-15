/**
 * Zod schema for the arguments of the read-jd tool (AgentCore gateway target).
 *
 * The gateway passes the tool input as a flat event object:
 * { jdId: '550e8400-e29b-41d4-a716-446655440000' }
 */

import { z } from 'zod';

/**
 * Schema for validating the read-jd tool arguments
 */
export const readJdArgsSchema = z.object({
  jdId: z.string().min(1, 'jdId cannot be empty'),
});

/**
 * Tool arguments type for the read-jd tool, inferred from the Zod schema.
 */
export type ReadJdArgs = z.infer<typeof readJdArgsSchema>;

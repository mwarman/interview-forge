/**
 * Zod schema for the arguments of the read-scorecard tool (AgentCore gateway target).
 *
 * The gateway passes the tool input as a flat event object:
 * { jdId: '550e8400-e29b-41d4-a716-446655440000', sessionId: '550e8400-e29b-41d4-a716-446655440001' }
 */

import { z } from 'zod';

/**
 * Schema for validating the read-scorecard tool arguments
 */
export const readScorecardArgsSchema = z.object({
  jdId: z.string().min(1, 'jdId cannot be empty'),
  sessionId: z.string().min(1, 'sessionId cannot be empty'),
});

/**
 * Tool arguments type for the read-scorecard tool, inferred from the Zod schema.
 */
export type ReadScorecardArgs = z.infer<typeof readScorecardArgsSchema>;

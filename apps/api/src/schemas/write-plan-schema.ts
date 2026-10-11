/**
 * Zod schemas for validating WritePlanAction events and parameters
 * in the Bedrock Action Agent.
 *
 * Event schema expects:
 * {
 *   actionGroup: 'interview-forge-write-plan',
 *   function: 'write-plan-action',
 *   parameters: [
 *     { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
 *     { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' },
 *     { name: 'plan', value: '{"interviewRounds":[...]}'
 *   ]
 * }
 *
 * The sessionId and jdId parameters are validated to ensure they are valid UUIDs.
 * The plan parameter is validated to ensure it is a non-empty string (JSON string of the interview plan).
 */
import { z } from 'zod';

import { BedrockActionEventSchema, BedrockParameterSchema } from '@interview-forge/shared';

/**
 * Schema for validating WritePlanAction handler event parameters
 * Expects parameters array to contain objects with names 'sessionId', 'jdId', and 'plan'
 * with non-empty string values. sessionId and jdId must be valid UUIDs.
 * plan must be a non-empty string (expected to be a JSON string of the interview plan).
 */
const writePlanActionEventParametersSchema = z.union([
  BedrockParameterSchema.extend({
    name: z.literal('sessionId'),
    value: z.string().min(1, 'sessionId parameter cannot be empty'),
  }),
  BedrockParameterSchema.extend({
    name: z.literal('jdId'),
    value: z.string().min(1, 'jdId parameter cannot be empty'),
  }),
  BedrockParameterSchema.extend({
    name: z.literal('plan'),
    value: z.string().min(1, 'plan parameter cannot be empty'),
  }),
]);

/**
 * Schema for validating WritePlanAction handler event
 * Expects: { actionGroup, function, parameters: [sessionId, jdId, plan] }
 */
export const writePlanActionEventSchema = BedrockActionEventSchema.extend({
  actionGroup: z.literal('interview-forge-write-plan'),
  function: z.literal('write-plan-action'),
  parameters: z.array(writePlanActionEventParametersSchema),
});

/**
 * Lambda event type for WritePlanAction handler, inferred from the Zod schema.
 */
export type WritePlanActionEvent = z.infer<typeof writePlanActionEventSchema>;

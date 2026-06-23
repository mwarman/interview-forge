/**
 * Zod schemas for the Bedrock Action Agent to read a plan from a session.
 * Validates the structure of the Bedrock event and the jdId and sessionId parameters.
 *
 * Event schema expects:
 * {
 *   actionGroup: 'interview-forge-read-plan',
 *   function: 'read-plan-action',
 *   parameters: [
 *     { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' },
 *     { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' }
 *   ]
 * }
 *
 * Both jdId and sessionId parameters are validated to ensure they are non-empty strings.
 */

import { z } from 'zod';

import { BedrockActionEventSchema, BedrockParameterSchema } from '@interview-forge/shared';

/**
 * Schema for validating ReadPlanAction handler event parameters
 * Expects parameters array to contain objects with names 'jdId' and 'sessionId'
 * with non-empty string values.
 */
const readPlanActionEventParametersSchema = z.union([
  BedrockParameterSchema.extend({
    name: z.literal('jdId'),
    value: z.string().min(1, 'jdId parameter cannot be empty'),
  }),
  BedrockParameterSchema.extend({
    name: z.literal('sessionId'),
    value: z.string().min(1, 'sessionId parameter cannot be empty'),
  }),
]);

/**
 * Schema for validating ReadPlanAction handler event
 * Expects: { actionGroup, function, parameters: [{ name: 'jdId', value: '...' }, { name: 'sessionId', value: '...' }] }
 */
export const readPlanActionEventSchema = BedrockActionEventSchema.extend({
  actionGroup: z.literal('interview-forge-read-plan'),
  function: z.literal('read-plan-action'),
  parameters: z.array(readPlanActionEventParametersSchema),
});

/**
 * Lambda event type for ReadPlanAction handler, inferred from the Zod schema.
 */
export type ReadPlanActionEvent = z.infer<typeof readPlanActionEventSchema>;

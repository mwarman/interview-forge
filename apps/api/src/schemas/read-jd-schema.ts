/**
 * Zod schemas for the Bedrock Action Agent to read a job description.
 * Validates the structure of the Bedrock event and the jdId parameter.
 *
 * Event schema expects:
 * {
 *   actionGroup: 'interview-forge-read-jd',
 *   function: 'read-jd-action',
 *   parameters: [
 *     { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }
 *   ]
 * }
 *
 * The jdId parameter is validated to ensure it is a non-empty string and a valid UUID.
 */

import { z } from 'zod';

import { BedrockActionEventSchema, BedrockParameterSchema } from '@interview-forge/shared';

/**
 * Schema for validating ReadJdAction handler event parameters
 * Expects parameters array to contain an object with name 'jdId' and a non-empty string value
 * that is also a valid UUID.
 */
const readJdActionEventParametersSchema = z.union([
  BedrockParameterSchema.extend({
    name: z.literal('jdId'),
    value: z.string().min(1, 'jdId parameter cannot be empty'),
  }),
]);

/**
 * Schema for validating ReadJdAction handler event
 * Expects: { actionGroup, function, parameters: [{ name: 'jdId', value: '...' }] }
 */
export const readJdActionEventSchema = BedrockActionEventSchema.extend({
  actionGroup: z.literal('interview-forge-read-jd'),
  function: z.literal('read-jd-action'),
  parameters: z.array(readJdActionEventParametersSchema),
});

/**
 * Lambda event type for ReadJdAction handler, inferred from the Zod schema.
 */
export type ReadJdActionEvent = z.infer<typeof readJdActionEventSchema>;

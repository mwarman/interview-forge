/**
 * Zod schemas for the Bedrock Action Agent to read a scorecard from a session.
 * Validates the structure of the Bedrock event and the jdId and sessionId parameters.
 *
 * Event schema expects:
 * {
 *   actionGroup: 'interview-forge-read-scorecard',
 *   function: 'read-scorecard-action',
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
 * Schema for validating ReadScorecardAction handler event parameters
 * Expects parameters array to contain objects with names 'jdId' and 'sessionId'
 * with non-empty string values.
 */
const readScorecardActionEventParametersSchema = z.union([
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
 * Schema for validating ReadScorecardAction handler event
 * Expects: { actionGroup, function, parameters: [{ name: 'jdId', value: '...' }, { name: 'sessionId', value: '...' }] }
 */
export const readScorecardActionEventSchema = BedrockActionEventSchema.extend({
  actionGroup: z.literal('interview-forge-read-scorecard'),
  function: z.literal('read-scorecard-action'),
  parameters: z.array(readScorecardActionEventParametersSchema),
});

/**
 * Lambda event type for ReadScorecardAction handler, inferred from the Zod schema.
 */
export type ReadScorecardActionEvent = z.infer<typeof readScorecardActionEventSchema>;

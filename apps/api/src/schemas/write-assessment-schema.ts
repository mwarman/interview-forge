/**
 * Zod schemas for validating WriteAssessmentAction events and parameters
 * in the Bedrock Action Agent.
 *
 * Event schema expects:
 * {
 *   actionGroup: 'interview-forge-write-assessment',
 *   function: 'write-assessment-action',
 *   parameters: [
 *     { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
 *     { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' },
 *     { name: 'assessment', value: '{"assessmentId":"...","recommendation":"HIRE",...}'
 *   ]
 * }
 *
 * The sessionId and jdId parameters are validated to ensure they are non-empty strings.
 * The assessment parameter is validated to ensure it is a non-empty string (JSON string of the assessment).
 */
import { z } from 'zod';

import { BedrockActionEventSchema, BedrockParameterSchema } from '@interview-forge/shared';

/**
 * Schema for validating WriteAssessmentAction handler event parameters
 * Expects parameters array to contain objects with names 'sessionId', 'jdId', and 'assessment'
 * with non-empty string values. sessionId and jdId must be non-empty strings.
 * assessment must be a non-empty string (expected to be a JSON string of the assessment).
 */
const writeAssessmentActionEventParametersSchema = z.union([
  BedrockParameterSchema.extend({
    name: z.literal('sessionId'),
    value: z.string().min(1, 'sessionId parameter cannot be empty'),
  }),
  BedrockParameterSchema.extend({
    name: z.literal('jdId'),
    value: z.string().min(1, 'jdId parameter cannot be empty'),
  }),
  BedrockParameterSchema.extend({
    name: z.literal('assessment'),
    value: z.string().min(1, 'assessment parameter cannot be empty'),
  }),
]);

/**
 * Schema for validating WriteAssessmentAction handler event
 * Expects: { actionGroup, function, parameters: [sessionId, jdId, assessment] }
 */
export const writeAssessmentActionEventSchema = BedrockActionEventSchema.extend({
  actionGroup: z.literal('interview-forge-write-assessment'),
  function: z.literal('write-assessment-action'),
  parameters: z.array(writeAssessmentActionEventParametersSchema),
});

/**
 * Lambda event type for WriteAssessmentAction handler, inferred from the Zod schema.
 */
export type WriteAssessmentActionEvent = z.infer<typeof writeAssessmentActionEventSchema>;

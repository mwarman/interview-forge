import { z } from 'zod';

/**
 * BedrockParameterSchema - Zod schema for a single action group parameter
 * Each parameter has a name and stringified value
 */
export const BedrockParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  value: z.string().min(1, 'Parameter value is required'),
});

/**
 * BedrockParameter - TypeScript type inferred from BedrockParameterSchema
 */
export type BedrockParameter = z.infer<typeof BedrockParameterSchema>;

/**
 * BedrockActionEventSchema - Zod schema for Bedrock Agents action group invocation
 * Contracts the shape: { actionGroup, function, parameters }
 * All parameters are passed as stringified values that must be parsed and validated downstream
 */
export const BedrockActionEventSchema = z.object({
  actionGroup: z.string().min(1, 'actionGroup is required'),
  function: z.string().min(1, 'function is required'),
  parameters: z.array(BedrockParameterSchema).min(1, 'At least one parameter is required'),
});

/**
 * BedrockActionEvent - TypeScript type inferred from BedrockActionEventSchema
 */
export type BedrockActionEvent = z.infer<typeof BedrockActionEventSchema>;

/**
 * BedrockFunctionResponseSchema - Zod schema for function response body
 * The responseBody.TEXT.body contains a JSON string of the actual response data
 */
export const BedrockFunctionResponseSchema = z.object({
  responseBody: z.object({
    TEXT: z.object({
      body: z.string().min(1, 'Response body is required'),
    }),
  }),
});

/**
 * BedrockFunctionResponse - TypeScript type inferred from BedrockFunctionResponseSchema
 */
export type BedrockFunctionResponse = z.infer<typeof BedrockFunctionResponseSchema>;

/**
 * BedrockActionResponseSchema - Zod schema for complete Bedrock Agents action group response
 * Echoes the actionGroup and function, and includes the functionResponse
 */
export const BedrockActionResponseSchema = z.object({
  actionGroup: z.string().min(1, 'actionGroup is required'),
  function: z.string().min(1, 'function is required'),
  functionResponse: BedrockFunctionResponseSchema,
});

/**
 * BedrockActionResponse - TypeScript type inferred from BedrockActionResponseSchema
 */
export type BedrockActionResponse = z.infer<typeof BedrockActionResponseSchema>;

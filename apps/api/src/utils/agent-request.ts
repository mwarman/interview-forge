/**
 * Utility functions for handling Bedrock Agent action events.
 */

import { BedrockParameter } from '@interview-forge/shared';

/**
 * Extract parameter value by name from Bedrock parameters array
 * @param parameters - Array of { name, value } parameters from Bedrock event
 * @param paramName - Name of parameter to extract
 * @param required - Whether the parameter is required (throws error if true and parameter is not found)
 * @returns Parameter value or undefined if not found (or throws error if required and not found)
 */
export const extractParameter = (
  parameters: Array<BedrockParameter>,
  paramName: string,
  required = false,
): string | undefined => {
  const param = parameters.find((p) => p.name === paramName)?.value;
  if (required && param === undefined) {
    throw new Error(`Missing required parameter: ${paramName}`);
  }
  return param;
};

/**
 * Extract required parameter value by name from Bedrock parameters array
 * @param parameters - Array of { name, value } parameters from Bedrock event
 * @param paramName - Name of parameter to extract
 * @returns Parameter value (throws error if parameter is not found)
 * @throws Error if the required parameter is not found
 */
export const extractRequiredParameter = (parameters: Array<BedrockParameter>, paramName: string): string => {
  return extractParameter(parameters, paramName, true)!;
};

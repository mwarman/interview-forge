/**
 * Bedrock Agent Response Utilities
 *
 * Provides utility functions to create properly formatted responses for Bedrock Agent
 * action group Lambda function invocations. Follows the Bedrock action group response contract:
 * { actionGroup, function, functionResponse: { responseBody: { TEXT: { body: JSON string } } } }
 */
import { BedrockActionEvent, BedrockActionResponse } from '@interview-forge/shared';

/**
 * Bedrock Agent Response Utilities
 *
 * Contains functions to create success and error responses for Bedrock Agent action group handlers.
 * Ensures all responses conform to the expected structure required by Bedrock Agents.
 */
export const agentResponse = {
  /**
   * Create a success response for a Bedrock Agent action
   * @param event - The Bedrock action event
   * @param payload - The response data to return
   * @returns Bedrock action response with success payload
   */
  ok<T>(event: BedrockActionEvent, payload: T): BedrockActionResponse {
    return {
      response: {
        actionGroup: event.actionGroup,
        function: event.function,
        functionResponse: {
          responseBody: {
            TEXT: {
              body: JSON.stringify(payload),
            },
          },
        },
      },
    };
  },

  /**
   * Create an error response for a Bedrock Agent action
   * @param event - The Bedrock action event
   * @param errorType - The error type/category (e.g., "Validation error", "Invalid parameters")
   * @param errorMessage - The error message with details
   * @returns Bedrock action response with error payload
   */
  error(event: BedrockActionEvent, errorType: string, errorMessage: string): BedrockActionResponse {
    return {
      response: {
        actionGroup: event.actionGroup || 'unknown-group',
        function: event.function || 'unknown-function',
        functionResponse: {
          responseState: 'FAILURE',
          responseBody: {
            TEXT: {
              body: JSON.stringify({
                error: errorType,
                message: errorMessage,
              }),
            },
          },
        },
      },
    };
  },
};

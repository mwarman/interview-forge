/**
 * AgentCore gateway tool result utilities.
 *
 * Gateway Lambda targets receive the tool arguments as a flat event object and may return any
 * JSON-serializable value. Failures are returned (not thrown) as { error, message } so the
 * model can read the problem and react.
 */
import { ZodError } from 'zod';

/**
 * Tool-level error returned to the agent
 */
export interface ToolErrorResult {
  error: string;
  message: string;
}

/**
 * Create a tool-level error result
 * @param error - The error type/category (e.g., "Not Found", "Invalid plan format")
 * @param message - The error message with details
 */
export const toolError = (error: string, message: string): ToolErrorResult => ({ error, message });

/**
 * Create a tool-level error result describing invalid tool arguments
 * @param zodError - The validation error raised for the tool arguments
 */
export const toolArgsError = (zodError: ZodError): ToolErrorResult =>
  toolError(
    'Invalid tool arguments',
    zodError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
  );

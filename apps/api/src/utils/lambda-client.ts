import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

/**
 * Singleton instance of Lambda client
 */
export const lambdaClient = new LambdaClient({});

/**
 * Invokes a Lambda function synchronously (RequestResponse).
 * The function waits for the response and returns the payload.
 *
 * @param functionName - The name or ARN of the Lambda function to invoke
 * @param payload - The JSON payload to pass to the Lambda function
 * @returns Promise that resolves to the response payload from the Lambda function
 * @throws Error if the Lambda invocation fails or returns a function error
 *
 * @example
 * ```typescript
 * interface MyResponse {
 *   result: string;
 *   statusCode: number;
 * }
 *
 * const response = await invokeLambdaSync<MyResponse>(
 *   'my-function-name',
 *   { key: 'value', data: { nested: true } }
 * );
 * console.log(response.result);
 * ```
 */
export const invokeLambdaSync = async <T = unknown>(functionName: string, payload: unknown): Promise<T> => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);

  // Check for function errors
  if (response.FunctionError) {
    throw new Error(`Lambda function error: ${response.FunctionError}`);
  }

  // Parse the response payload
  const responsePayload = response.Payload ? JSON.parse(new TextDecoder().decode(response.Payload)) : null;

  return responsePayload as T;
};

/**
 * Invokes a Lambda function asynchronously (Event).
 * The function returns immediately without waiting for the Lambda execution to complete.
 *
 * @param functionName - The name or ARN of the Lambda function to invoke
 * @param payload - The JSON payload to pass to the Lambda function
 * @returns Promise that resolves when the invocation request is accepted
 * @throws Error if the Lambda invocation request fails
 *
 * @example
 * ```typescript
 * // Fire and forget invocation
 * await invokeLambdaAsync(
 *   'my-async-function',
 *   { eventType: 'process', data: [1, 2, 3] }
 * );
 * ```
 */
export const invokeLambdaAsync = async (functionName: string, payload: unknown): Promise<void> => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);

  // Check for function errors (though async invocations typically won't return function errors)
  if (response.FunctionError) {
    throw new Error(`Lambda function error: ${response.FunctionError}`);
  }
};

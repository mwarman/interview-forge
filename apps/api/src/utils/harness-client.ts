import { BedrockAgentCoreClient, InvokeHarnessCommand } from '@aws-sdk/client-bedrock-agentcore';

import { logger } from '@/utils/logger';

/**
 * Singleton instance of the Bedrock AgentCore client
 */
export const agentCoreClient = new BedrockAgentCoreClient({});

/**
 * Parameters for invoking an AgentCore harness
 */
export interface InvokeHarnessParams {
  harnessArn: string;
  sessionId: string;
  prompt: string;
}

/**
 * Invokes an AgentCore harness with a single user message and drains the response stream.
 * The stream's exhaustion marks the end of the agent loop; callers read results from storage.
 * Token usage from the metadata event is logged for cost monitoring.
 *
 * @param params - The harness ARN, runtime session ID and user prompt
 * @returns The concatenated text emitted by the agent (for logging purposes)
 * @throws Error if no stream is returned or the stream carries an error event
 */
export const invokeHarness = async ({ harnessArn, sessionId, prompt }: InvokeHarnessParams): Promise<string> => {
  const response = await agentCoreClient.send(
    new InvokeHarnessCommand({
      harnessArn,
      runtimeSessionId: sessionId,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
    }),
  );

  if (!response.stream) {
    throw new Error('No stream returned from harness');
  }

  let agentResponse = '';
  for await (const event of response.stream) {
    if (event.contentBlockDelta?.delta?.text) {
      agentResponse += event.contentBlockDelta.delta.text;
    } else if (event.metadata) {
      logger.info({ usage: event.metadata.usage, metrics: event.metadata.metrics }, '[HarnessClient] - Harness usage');
    } else if (event.runtimeClientError) {
      throw new Error(`Harness runtime client error: ${event.runtimeClientError.message}`);
    } else if (event.validationException) {
      throw new Error(`Harness validation error: ${event.validationException.message}`);
    } else if (event.internalServerException) {
      throw new Error(`Harness internal server error: ${event.internalServerException.message}`);
    }
  }

  return agentResponse;
};

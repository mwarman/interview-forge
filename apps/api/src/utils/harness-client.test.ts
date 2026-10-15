import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@aws-sdk/client-bedrock-agentcore');

import { BedrockAgentCoreClient, InvokeHarnessCommand } from '@aws-sdk/client-bedrock-agentcore';
import { agentCoreClient, invokeHarness } from './harness-client';

const params = {
  harnessArn: 'arn:aws:bedrock-agentcore:us-east-1:123:harness/h',
  sessionId: 'session-1',
  prompt: 'Go',
};

const streamOf = async function* (events: unknown[]) {
  for (const event of events) {
    yield event;
  }
};

const mockStream = (events: unknown[]) =>
  vi.mocked(agentCoreClient.send).mockResolvedValue({ stream: streamOf(events) } as never);

describe('harness-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a BedrockAgentCoreClient instance', () => {
    // Assert
    expect(agentCoreClient).toBeInstanceOf(BedrockAgentCoreClient);
  });

  it('should send an InvokeHarnessCommand with harness ARN, session ID and user message', async () => {
    // Arrange
    mockStream([]);

    // Act
    await invokeHarness(params);

    // Assert
    expect(InvokeHarnessCommand).toHaveBeenCalledWith({
      harnessArn: params.harnessArn,
      runtimeSessionId: params.sessionId,
      messages: [{ role: 'user', content: [{ text: params.prompt }] }],
    });
  });

  it('should accumulate text deltas and ignore usage metadata', async () => {
    // Arrange
    mockStream([
      { contentBlockDelta: { delta: { text: 'Hello ' } } },
      { contentBlockDelta: { delta: { text: 'world' } } },
      { metadata: { usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 }, metrics: {} } },
      { messageStop: {} },
    ]);

    // Act
    const result = await invokeHarness(params);

    // Assert
    expect(result).toBe('Hello world');
  });

  it('should throw when no stream is returned', async () => {
    // Arrange
    vi.mocked(agentCoreClient.send).mockResolvedValue({} as never);

    // Act & Assert
    await expect(invokeHarness(params)).rejects.toThrow('No stream returned from harness');
  });

  it.each([
    ['runtimeClientError', 'Harness runtime client error: boom'],
    ['validationException', 'Harness validation error: boom'],
    ['internalServerException', 'Harness internal server error: boom'],
  ])('should throw on %s stream events', async (eventName, expected) => {
    // Arrange
    mockStream([{ [eventName]: { message: 'boom' } }]);

    // Act & Assert
    await expect(invokeHarness(params)).rejects.toThrow(expected);
  });

  it('should propagate errors thrown by the client', async () => {
    // Arrange
    vi.mocked(agentCoreClient.send).mockRejectedValue(new Error('Access denied'));

    // Act & Assert
    await expect(invokeHarness(params)).rejects.toThrow('Access denied');
  });
});

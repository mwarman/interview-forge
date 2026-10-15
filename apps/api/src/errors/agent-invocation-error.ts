/**
 * AgentInvocationError
 * Thrown when a AgentCore harness invocation fails, such as network errors,
 * authentication issues, or agent runtime exceptions.
 */
export class AgentInvocationError extends Error {
  constructor(
    public jdId: string,
    public sessionId: string,
    public cause: Error,
    message: string = 'Failed to invoke AgentCore harness',
  ) {
    super(message);
    this.name = 'AgentInvocationError';
    Object.setPrototypeOf(this, AgentInvocationError.prototype);
  }
}

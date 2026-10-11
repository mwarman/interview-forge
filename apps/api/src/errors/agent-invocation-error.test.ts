import { describe, it, expect } from 'vitest';

import { AgentInvocationError } from './agent-invocation-error';

describe('AgentInvocationError', () => {
  it('should create an error with jdId, sessionId, and cause', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660e8400-e29b-41d4-a716-446655440001';
    const cause = new Error('Network timeout');

    const error = new AgentInvocationError(jdId, sessionId, cause);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AgentInvocationError);
    expect(error.name).toBe('AgentInvocationError');
    expect(error.jdId).toBe(jdId);
    expect(error.sessionId).toBe(sessionId);
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Failed to invoke Bedrock Agent');
  });

  it('should allow custom error message', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660e8400-e29b-41d4-a716-446655440001';
    const cause = new Error('Authorization failed');
    const customMessage = 'Agent authorization error';

    const error = new AgentInvocationError(jdId, sessionId, cause, customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.cause.message).toBe('Authorization failed');
  });
});

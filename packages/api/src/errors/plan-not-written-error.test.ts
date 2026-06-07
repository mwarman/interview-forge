import { describe, it, expect } from 'vitest';

import { PlanNotWrittenError } from './plan-not-written-error';

describe('PlanNotWrittenError', () => {
  it('should create an error with jdId and sessionId', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660e8400-e29b-41d4-a716-446655440001';

    const error = new PlanNotWrittenError(jdId, sessionId);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PlanNotWrittenError);
    expect(error.name).toBe('PlanNotWrittenError');
    expect(error.jdId).toBe(jdId);
    expect(error.sessionId).toBe(sessionId);
    expect(error.message).toBe('Agent completed without writing plan to session');
  });

  it('should allow custom error message', () => {
    const jdId = '550e8400-e29b-41d4-a716-446655440000';
    const sessionId = '660e8400-e29b-41d4-a716-446655440001';
    const customMessage = 'Custom error message';

    const error = new PlanNotWrittenError(jdId, sessionId, customMessage);

    expect(error.message).toBe(customMessage);
  });
});

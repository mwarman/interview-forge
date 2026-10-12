import { describe, it, expect } from 'vitest';

import { writePlanArgsSchema } from './write-plan-schema';

const validArgs = {
  jdId: '550e8400-e29b-41d4-a716-446655440000',
  sessionId: '660e8400-e29b-41d4-a716-446655440001',
  plan: '{"key":"value"}',
};

describe('writePlanArgsSchema', () => {
  it('should accept valid jdId, sessionId and plan', () => {
    // Act
    const result = writePlanArgsSchema.safeParse(validArgs);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validArgs);
  });

  it.each(['jdId', 'sessionId', 'plan'])('should reject when %s is missing', (key) => {
    // Arrange
    const args = { ...validArgs, [key]: undefined };

    // Act
    const result = writePlanArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each(['jdId', 'sessionId', 'plan'])('should reject when %s is empty', (key) => {
    // Arrange
    const args = { ...validArgs, [key]: '' };

    // Act
    const result = writePlanArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });
});

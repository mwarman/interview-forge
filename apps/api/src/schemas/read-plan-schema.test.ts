import { describe, it, expect } from 'vitest';

import { readPlanArgsSchema } from './read-plan-schema';

describe('readPlanArgsSchema', () => {
  it('should accept valid jdId and sessionId', () => {
    // Arrange
    const args = { jdId: '550e8400-e29b-41d4-a716-446655440000', sessionId: '660e8400-e29b-41d4-a716-446655440001' };

    // Act
    const result = readPlanArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(args);
  });

  it.each([
    [{}],
    [{ jdId: 'a' }],
    [{ sessionId: 'a' }],
    [{ jdId: '', sessionId: 'a' }],
    [{ jdId: 'a', sessionId: '' }],
  ])('should reject invalid args %j', (args) => {
    // Act
    const result = readPlanArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });
});

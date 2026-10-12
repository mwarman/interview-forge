import { describe, it, expect } from 'vitest';

import { readJdArgsSchema } from './read-jd-schema';

describe('readJdArgsSchema', () => {
  it('should accept a valid jdId', () => {
    // Arrange
    const args = { jdId: '550e8400-e29b-41d4-a716-446655440000' };

    // Act
    const result = readJdArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(args);
  });

  it.each([[{}], [{ jdId: '' }], [{ jdId: 123 }], [null]])('should reject invalid args %j', (args) => {
    // Act
    const result = readJdArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });
});

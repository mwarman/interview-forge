import { describe, it, expect } from 'vitest';

import { writeAssessmentArgsSchema } from './write-assessment-schema';

const validArgs = {
  jdId: '550e8400-e29b-41d4-a716-446655440000',
  sessionId: '660e8400-e29b-41d4-a716-446655440001',
  assessment: '{"key":"value"}',
};

describe('writeAssessmentArgsSchema', () => {
  it('should accept valid jdId, sessionId and assessment', () => {
    // Act
    const result = writeAssessmentArgsSchema.safeParse(validArgs);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validArgs);
  });

  it.each(['jdId', 'sessionId', 'assessment'])('should reject when %s is missing', (key) => {
    // Arrange
    const args = { ...validArgs, [key]: undefined };

    // Act
    const result = writeAssessmentArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each(['jdId', 'sessionId', 'assessment'])('should reject when %s is empty', (key) => {
    // Arrange
    const args = { ...validArgs, [key]: '' };

    // Act
    const result = writeAssessmentArgsSchema.safeParse(args);

    // Assert
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { JobDescriptionSchema, SessionSchema, SessionStatusSchema, type SessionStatus } from './index';

describe('Shared Package Exports', () => {
  it('should export JobDescriptionSchema', () => {
    // Arrange & Act & Assert
    expect(JobDescriptionSchema).toBeDefined();
    expect(typeof JobDescriptionSchema.parse).toBe('function');
  });

  it('should export SessionSchema', () => {
    // Arrange & Act & Assert
    expect(SessionSchema).toBeDefined();
    expect(typeof SessionSchema.parse).toBe('function');
  });

  it('should export SessionStatusSchema', () => {
    // Arrange & Act & Assert
    expect(SessionStatusSchema).toBeDefined();
    expect(typeof SessionStatusSchema.parse).toBe('function');
  });

  it('should export SessionStatus type', () => {
    // Arrange & Act & Assert
    const status: SessionStatus = 'PLAN_PENDING';
    expect(status).toBeDefined();
  });
});

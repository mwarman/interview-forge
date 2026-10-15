import { describe, it, expect } from 'vitest';
import { assessWorkerEventSchema, type AssessWorkerEvent } from './assess-worker-event-schema';

describe('assessWorkerEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid AssessWorkerEvent with all required parameters', () => {
      // Arrange
      const event = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = assessWorkerEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: AssessWorkerEvent = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = assessWorkerEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

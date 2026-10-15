import { describe, it, expect } from 'vitest';
import { planWorkerEventSchema, type PlanWorkerEvent } from './plan-worker-event-schema';

describe('planWorkerEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid PlanWorkerEvent with all required parameters', () => {
      // Arrange
      const event = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = planWorkerEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: PlanWorkerEvent = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = planWorkerEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

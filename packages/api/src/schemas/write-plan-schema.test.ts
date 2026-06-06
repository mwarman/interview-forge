import { describe, it, expect } from 'vitest';
import { writePlanActionEventSchema, type WritePlanActionEvent } from './write-plan-schema';

describe('writePlanActionEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid WritePlanAction event with all required parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'plan',
            value: '{"interviewRounds":[{"round":1,"topic":"System Design"}]}',
          },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionGroup).toBe('plan');
        expect(result.data.function).toBe('write-plan-action');
        expect(result.data.parameters).toHaveLength(3);
      }
    });

    it('should accept event with parameters in different order', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'plan',
            value: '{"interviewRounds":[]}',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept event with exactly required parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'plan',
            value: '{"interviewRounds":[]}',
          },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters).toHaveLength(3);
      }
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: WritePlanActionEvent = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'plan',
            value: '{"interviewRounds":[]}',
          },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept plan with complex JSON string', () => {
      // Arrange
      const complexPlan = JSON.stringify({
        interviewRounds: [
          {
            round: 1,
            topic: 'System Design',
            duration: 45,
            questions: ['Design a caching layer', 'Discuss trade-offs'],
          },
          {
            round: 2,
            topic: 'Behavioral',
            duration: 30,
            questions: ['Tell about a challenge', 'How do you handle conflict?'],
          },
        ],
      });

      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'plan',
            value: complexPlan,
          },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject event with wrong actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: 'wrong-group',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: '',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject event with wrong function', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'wrong-function',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid sessionId parameter', () => {
    it('should reject event with empty sessionId value', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sessionId parameter cannot be empty');
      }
    });

    it('should accept event with valid sessionId even if other parameters missing', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [{ name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' }],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid jdId parameter', () => {
    it('should reject event with empty jdId value', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('jdId parameter cannot be empty');
      }
    });

    it('should accept event with valid jdId even if other parameters missing', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' }],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid plan parameter', () => {
    it('should reject event with empty plan value', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('plan parameter cannot be empty');
      }
    });

    it('should accept event with valid plan even if other parameters missing', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [{ name: 'plan', value: '{"rounds": []}' }],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid parameters array', () => {
    it('should accept event with empty parameters array (union allows any combination)', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      // Note: The union schema allows any valid parameter combination, including empty
      // Handler implementations should validate that required parameters are present
      expect(result.success).toBe(true);
    });

    it('should reject event with missing parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject event with missing actionGroup', () => {
      // Arrange
      const event = {
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with missing function', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should reject parameter with missing name', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with missing value', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty name', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: '', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty value', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{}' },
        ],
      };

      // Act
      const result = writePlanActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { readJdActionEventSchema, type ReadJdActionEvent } from './read-jd-schema';

describe('readJdActionEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid ReadJdAction event with UUID jdId', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionGroup).toBe('interview-forge-read-jd');
        expect(result.data.function).toBe('read-jd-action');
        expect(result.data.parameters[0].name).toBe('jdId');
        expect(result.data.parameters[0].value).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should accept valid event with single jdId parameter', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters).toHaveLength(1);
      }
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: ReadJdActionEvent = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject event with wrong actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: 'wrong-group',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: '',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject event with wrong function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'wrong-function',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: '',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid jdId parameter', () => {
    it('should reject event with empty jdId value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('jdId parameter cannot be empty');
      }
    });

    it('should reject event with missing jdId parameter', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'other-param',
            value: 'some-value',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with wrong parameter name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'wrongParamName',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid parameters array', () => {
    it('should accept event with empty parameters array (union allows any combination)', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      // Note: The union schema allows any valid parameter combination, including empty
      // Handler implementations should validate that required parameters are present
      expect(result.success).toBe(true);
    });

    it('should reject event with missing parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject event with missing actionGroup', () => {
      // Arrange
      const event = {
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with missing function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should reject parameter with missing name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with missing value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: '',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '',
          },
        ],
      };

      // Act
      const result = readJdActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

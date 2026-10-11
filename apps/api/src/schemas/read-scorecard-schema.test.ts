import { describe, it, expect } from 'vitest';

import { readScorecardActionEventSchema, type ReadScorecardActionEvent } from './read-scorecard-schema';

describe('readScorecardActionEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid ReadScorecardAction event with jdId and sessionId', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionGroup).toBe('interview-forge-read-scorecard');
        expect(result.data.function).toBe('read-scorecard-action');
        expect(result.data.parameters).toHaveLength(2);
      }
    });

    it('should accept event with parameters in different order', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: ReadScorecardActionEvent = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject event with wrong actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: 'wrong-group',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: '',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject event with wrong function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'wrong-function',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: '',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid jdId parameter', () => {
    it('should reject event with empty jdId value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('jdId parameter cannot be empty');
      }
    });
  });

  describe('invalid sessionId parameter', () => {
    it('should reject event with empty sessionId value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sessionId parameter cannot be empty');
      }
    });
  });

  describe('invalid parameters array', () => {
    it('should accept event with empty parameters array (union allows any combination)', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      // Note: The union schema allows any valid parameter combination, including empty
      // Handler implementations should validate that required parameters are present
      expect(result.success).toBe(true);
    });

    it('should reject event with missing parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject event with missing actionGroup', () => {
      // Arrange
      const event = {
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with missing function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should reject parameter with missing name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with missing value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: '',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-read-scorecard',
        function: 'read-scorecard-action',
        parameters: [
          {
            name: 'jdId',
            value: '',
          },
          {
            name: 'sessionId',
            value: '660f9411-f30c-42e5-b827-557766551111',
          },
        ],
      };

      // Act
      const result = readScorecardActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

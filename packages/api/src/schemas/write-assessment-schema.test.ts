import { describe, it, expect } from 'vitest';

import { writeAssessmentActionEventSchema, type WriteAssessmentActionEvent } from './write-assessment-schema';

describe('writeAssessmentActionEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid WriteAssessmentAction event with all required parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333","recommendation":"HIRE"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionGroup).toBe('interview-forge-write-assessment');
        expect(result.data.function).toBe('write-assessment-action');
        expect(result.data.parameters).toHaveLength(3);
      }
    });

    it('should accept event with parameters in different order', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
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
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept event with exactly required parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters).toHaveLength(3);
      }
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: WriteAssessmentActionEvent = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject event with wrong actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: 'wrong-group',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: '',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject event with wrong function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'wrong-function',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with empty function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: '',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid sessionId parameter', () => {
    it('should reject event with empty sessionId value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'sessionId',
            value: '',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sessionId parameter cannot be empty');
      }
    });
  });

  describe('invalid jdId parameter', () => {
    it('should reject event with empty jdId value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'sessionId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('jdId parameter cannot be empty');
      }
    });
  });

  describe('invalid assessment parameter', () => {
    it('should reject event with empty assessment value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('assessment parameter cannot be empty');
      }
    });
  });

  describe('invalid parameters array', () => {
    it('should accept event with empty parameters array (union allows any combination)', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      // Note: The union schema allows any valid parameter combination, including empty
      // Handler implementations should validate that required parameters are present
      expect(result.success).toBe(true);
    });

    it('should reject event with missing parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject event with missing actionGroup', () => {
      // Arrange
      const event = {
        function: 'write-assessment-action',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with missing function', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
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
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should reject parameter with missing name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with missing value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'sessionId',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty name', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: '',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty value', () => {
      // Arrange
      const event = {
        actionGroup: 'interview-forge-write-assessment',
        function: 'write-assessment-action',
        parameters: [
          {
            name: 'sessionId',
            value: '',
          },
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            name: 'assessment',
            value: '{"assessmentId":"880c6633-351e-43d7-8949-779988773333"}',
          },
        ],
      };

      // Act
      const result = writeAssessmentActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

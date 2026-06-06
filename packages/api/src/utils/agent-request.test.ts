import { describe, it, expect } from 'vitest';
import { extractParameter, extractRequiredParameter } from './agent-request';
import type { BedrockParameter } from '@interview-forge/shared';

describe('extractParameter', () => {
  describe('extracting existing parameters', () => {
    it('should extract parameter value by name', () => {
      // Arrange
      const parameters: BedrockParameter[] = [
        { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' },
        { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440001' },
      ];

      // Act
      const result = extractParameter(parameters, 'jdId');

      // Assert
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract parameter from array with multiple parameters', () => {
      // Arrange
      const parameters: BedrockParameter[] = [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: 'value2' },
        { name: 'param3', value: 'value3' },
      ];

      // Act
      const result = extractParameter(parameters, 'param2');

      // Assert
      expect(result).toBe('value2');
    });

    it('should extract first matching parameter when multiple with same name', () => {
      // Arrange
      const parameters: BedrockParameter[] = [
        { name: 'jdId', value: 'first-value' },
        { name: 'sessionId', value: 'other-value' },
        { name: 'jdId', value: 'second-value' },
      ];

      // Act
      const result = extractParameter(parameters, 'jdId');

      // Assert
      expect(result).toBe('first-value');
    });

    it('should return parameter value with complex string content', () => {
      // Arrange
      const complexValue = JSON.stringify({
        rounds: [{ round: 1, topic: 'System Design' }],
      });
      const parameters: BedrockParameter[] = [{ name: 'plan', value: complexValue }];

      // Act
      const result = extractParameter(parameters, 'plan');

      // Assert
      expect(result).toBe(complexValue);
      expect(result).toContain('System Design');
    });
  });

  describe('extracting non-existing parameters', () => {
    it('should return undefined when parameter name not found and not required', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }];

      // Act
      const result = extractParameter(parameters, 'nonExistent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when parameters array is empty and not required', () => {
      // Arrange
      const parameters: BedrockParameter[] = [];

      // Act
      const result = extractParameter(parameters, 'anyParam');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw error when required parameter not found', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }];

      // Act & Assert
      expect(() => {
        extractParameter(parameters, 'nonExistent', true);
      }).toThrow('Missing required parameter: nonExistent');
    });

    it('should throw error with correct parameter name in message', () => {
      // Arrange
      const parameters: BedrockParameter[] = [];

      // Act & Assert
      expect(() => {
        extractParameter(parameters, 'sessionId', true);
      }).toThrow('Missing required parameter: sessionId');
    });
  });

  describe('parameter name matching', () => {
    it('should perform case-sensitive matching', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: 'value1' }];

      // Act
      const result = extractParameter(parameters, 'jdid');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should match exact parameter name', () => {
      // Arrange
      const parameters: BedrockParameter[] = [
        { name: 'sessionId', value: 'value1' },
        { name: 'session', value: 'value2' },
      ];

      // Act
      const result = extractParameter(parameters, 'session');

      // Assert
      expect(result).toBe('value2');
    });
  });

  describe('optional parameter flag', () => {
    it('should not require parameter when required flag is false', () => {
      // Arrange
      const parameters: BedrockParameter[] = [];

      // Act
      const result = extractParameter(parameters, 'param', false);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should default to not required when flag omitted', () => {
      // Arrange
      const parameters: BedrockParameter[] = [];

      // Act
      const result = extractParameter(parameters, 'param');

      // Assert
      expect(result).toBeUndefined();
    });
  });
});

describe('extractRequiredParameter', () => {
  describe('extracting existing required parameters', () => {
    it('should extract required parameter value by name', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }];

      // Act
      const result = extractRequiredParameter(parameters, 'jdId');

      // Assert
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract required parameter from array with multiple parameters', () => {
      // Arrange
      const parameters: BedrockParameter[] = [
        { name: 'sessionId', value: 'session-123' },
        { name: 'jdId', value: 'jd-456' },
        { name: 'plan', value: '{}' },
      ];

      // Act
      const result = extractRequiredParameter(parameters, 'plan');

      // Assert
      expect(result).toBe('{}');
    });

    it('should return non-undefined string for required parameter', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'data', value: 'some-value' }];

      // Act
      const result = extractRequiredParameter(parameters, 'data');

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should extract parameter with complex JSON string value', () => {
      // Arrange
      const jsonValue = JSON.stringify({
        rounds: [
          { round: 1, topic: 'System Design', duration: 45 },
          { round: 2, topic: 'Behavioral', duration: 30 },
        ],
      });
      const parameters: BedrockParameter[] = [{ name: 'plan', value: jsonValue }];

      // Act
      const result = extractRequiredParameter(parameters, 'plan');

      // Assert
      expect(result).toBe(jsonValue);
      const parsed = JSON.parse(result);
      expect(parsed.rounds).toHaveLength(2);
    });
  });

  describe('extracting missing required parameters', () => {
    it('should throw error when required parameter not found', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }];

      // Act & Assert
      expect(() => {
        extractRequiredParameter(parameters, 'missingParam');
      }).toThrow('Missing required parameter: missingParam');
    });

    it('should throw error when parameters array is empty', () => {
      // Arrange
      const parameters: BedrockParameter[] = [];

      // Act & Assert
      expect(() => {
        extractRequiredParameter(parameters, 'sessionId');
      }).toThrow('Missing required parameter: sessionId');
    });

    it('should throw error with correct parameter name', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'param1', value: 'value1' }];

      // Act & Assert
      expect(() => {
        extractRequiredParameter(parameters, 'sessionId');
      }).toThrow('Missing required parameter: sessionId');
    });

    it('should perform case-sensitive search for required parameter', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'jdId', value: 'value1' }];

      // Act & Assert
      expect(() => {
        extractRequiredParameter(parameters, 'jdid');
      }).toThrow('Missing required parameter: jdid');
    });
  });

  describe('type safety', () => {
    it('should always return a string (not undefined) for required parameter', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'data', value: 'some-value' }];

      // Act
      const result = extractRequiredParameter(parameters, 'data');

      // Assert
      expect(typeof result).toBe('string');
      expect(result).not.toBeUndefined();
      expect(result).not.toBeNull();
    });

    it('should return non-falsy string value', () => {
      // Arrange
      const parameters: BedrockParameter[] = [{ name: 'value', value: 'non-empty' }];

      // Act
      const result = extractRequiredParameter(parameters, 'value');

      // Assert
      expect(Boolean(result)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should extract parameter with value containing special characters', () => {
      // Arrange
      const specialValue = 'value-with_special.chars@123';
      const parameters: BedrockParameter[] = [{ name: 'param', value: specialValue }];

      // Act
      const result = extractRequiredParameter(parameters, 'param');

      // Assert
      expect(result).toBe(specialValue);
    });

    it('should extract parameter with whitespace in value', () => {
      // Arrange
      const valueWithSpaces = '  value with spaces  ';
      const parameters: BedrockParameter[] = [{ name: 'param', value: valueWithSpaces }];

      // Act
      const result = extractRequiredParameter(parameters, 'param');

      // Assert
      expect(result).toBe(valueWithSpaces);
    });

    it('should extract parameter with value containing escaped characters', () => {
      // Arrange
      const valueWithEscapes = 'line1\\nline2\\ttab';
      const parameters: BedrockParameter[] = [{ name: 'param', value: valueWithEscapes }];

      // Act
      const result = extractRequiredParameter(parameters, 'param');

      // Assert
      expect(result).toBe(valueWithEscapes);
    });
  });
});

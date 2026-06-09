import { describe, it, expect } from 'vitest';
import {
  BedrockParameterSchema,
  BedrockActionEventSchema,
  BedrockFunctionResponseSchema,
  BedrockActionResponseSchema,
  type BedrockParameter,
  type BedrockActionEvent,
  type BedrockFunctionResponse,
  type BedrockActionResponse,
} from './bedrock-action';

describe('BedrockParameterSchema', () => {
  describe('valid parameters', () => {
    it('should accept valid parameter with name and value', () => {
      // Arrange
      const parameter = {
        name: 'jdId',
        value: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('jdId');
        expect(result.data.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should accept parameter with any non-empty string name and value', () => {
      // Arrange
      const parameter = {
        name: 'anyParameterName',
        value: 'anyStringValue',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct type for valid parameter', () => {
      // Arrange
      const parameter: BedrockParameter = {
        name: 'sessionId',
        value: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid parameters', () => {
    it('should reject parameter with empty name', () => {
      // Arrange
      const parameter = {
        name: '',
        value: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Parameter name is required');
      }
    });

    it('should reject parameter with empty value', () => {
      // Arrange
      const parameter = {
        name: 'jdId',
        value: '',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Parameter value is required');
      }
    });

    it('should reject parameter with missing name', () => {
      // Arrange
      const parameter = {
        value: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with missing value', () => {
      // Arrange
      const parameter = {
        name: 'jdId',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with non-string name', () => {
      // Arrange
      const parameter = {
        name: 123,
        value: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject parameter with non-string value', () => {
      // Arrange
      const parameter = {
        name: 'jdId',
        value: 123,
      };

      // Act
      const result = BedrockParameterSchema.safeParse(parameter);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('BedrockActionEventSchema', () => {
  describe('valid events', () => {
    it('should accept valid action event with all required fields', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: 'read-jd-action',
        parameters: [
          {
            name: 'jdId',
            value: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionGroup).toBe('jd');
        expect(result.data.function).toBe('read-jd-action');
        expect(result.data.parameters).toHaveLength(1);
      }
    });

    it('should accept event with multiple parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'plan',
        function: 'write-plan-action',
        parameters: [
          { name: 'sessionId', value: '550e8400-e29b-41d4-a716-446655440000' },
          { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440001' },
          { name: 'plan', value: '{"rounds":[]}' },
        ],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters).toHaveLength(3);
      }
    });

    it('should infer correct type for valid event', () => {
      // Arrange
      const event: BedrockActionEvent = {
        actionGroup: 'action-group',
        function: 'some-function',
        parameters: [
          {
            name: 'param',
            value: 'value',
          },
        ],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject event with empty actionGroup', () => {
      // Arrange
      const event = {
        actionGroup: '',
        function: 'read-jd-action',
        parameters: [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('actionGroup is required');
      }
    });

    it('should reject event with missing actionGroup', () => {
      // Arrange
      const event = {
        function: 'read-jd-action',
        parameters: [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject event with empty function', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: '',
        parameters: [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('function is required');
      }
    });

    it('should reject event with missing function', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        parameters: [{ name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' }],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid parameters', () => {
    it('should reject event with empty parameters array', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: 'read-jd-action',
        parameters: [],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one parameter is required');
      }
    });

    it('should reject event with missing parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: 'read-jd-action',
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with non-array parameters', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: 'read-jd-action',
        parameters: { name: 'jdId', value: '550e8400-e29b-41d4-a716-446655440000' },
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject event with invalid parameter in array', () => {
      // Arrange
      const event = {
        actionGroup: 'jd',
        function: 'read-jd-action',
        parameters: [{ name: 'jdId' }],
      };

      // Act
      const result = BedrockActionEventSchema.safeParse(event);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('BedrockFunctionResponseSchema', () => {
  describe('valid responses', () => {
    it('should accept valid function response with TEXT body', () => {
      // Arrange
      const response = {
        responseBody: {
          TEXT: {
            body: '{"success": true}',
          },
        },
      };

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responseBody.TEXT.body).toBe('{"success": true}');
      }
    });

    it('should infer correct type for valid response', () => {
      // Arrange
      const response: BedrockFunctionResponse = {
        responseBody: {
          TEXT: {
            body: 'response data',
          },
        },
      };

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid responses', () => {
    it('should reject response with empty body', () => {
      // Arrange
      const response = {
        responseBody: {
          TEXT: {
            body: '',
          },
        },
      };

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Response body is required');
      }
    });

    it('should reject response with missing body', () => {
      // Arrange
      const response = {
        responseBody: {
          TEXT: {},
        },
      };

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with missing TEXT', () => {
      // Arrange
      const response = {
        responseBody: {},
      };

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with missing responseBody', () => {
      // Arrange
      const response = {};

      // Act
      const result = BedrockFunctionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('BedrockActionResponseSchema', () => {
  describe('valid responses', () => {
    it('should accept valid action response with all required fields', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: 'jd',
          function: 'read-jd-action',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: '{"title": "Senior Engineer"}',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.response.actionGroup).toBe('jd');
        expect(result.data.response.function).toBe('read-jd-action');
      }
    });

    it('should infer correct type for valid response', () => {
      // Arrange
      const response: BedrockActionResponse = {
        response: {
          actionGroup: 'plan',
          function: 'write-plan-action',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'plan created',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid actionGroup', () => {
    it('should reject response with empty actionGroup', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: '',
          function: 'read-jd-action',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'response',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('actionGroup is required');
      }
    });

    it('should reject response with missing actionGroup', () => {
      // Arrange
      const response = {
        response: {
          function: 'read-jd-action',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'response',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid function', () => {
    it('should reject response with empty function', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: 'jd',
          function: '',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'response',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('function is required');
      }
    });

    it('should reject response with missing function', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: 'jd',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'response',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid functionResponse', () => {
    it('should reject response with missing functionResponse', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: 'jd',
          function: 'read-jd-action',
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with invalid functionResponse', () => {
      // Arrange
      const response = {
        response: {
          actionGroup: 'jd',
          function: 'read-jd-action',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: '',
              },
            },
          },
        },
      };

      // Act
      const result = BedrockActionResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

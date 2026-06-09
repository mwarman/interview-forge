import { describe, it, expect } from 'vitest';

import { agentResponse } from './agent-response';
import { BedrockActionEvent } from '@interview-forge/shared';

describe('agent-response utilities', () => {
  const mockEvent: BedrockActionEvent = {
    actionGroup: 'plan',
    function: 'write-plan-action',
    parameters: [],
  };

  describe('agentResponse.ok', () => {
    it('should create a properly formatted success response', () => {
      // Arrange
      const payload = { sessionId: '123', status: 'PLAN_PENDING', message: 'Success' };

      // Act
      const result = agentResponse.ok(mockEvent, payload);

      // Assert
      expect(result.response.actionGroup).toBe('plan');
      expect(result.response.function).toBe('write-plan-action');
      expect(result.response.functionResponse).toBeDefined();
      expect(result.response.functionResponse.responseBody.TEXT.body).toBe(JSON.stringify(payload));
    });

    it('should parse response body as valid JSON', () => {
      // Arrange
      const payload = { data: 'test', nested: { value: 123 } };

      // Act
      const result = agentResponse.ok(mockEvent, payload);
      const parsedBody = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);

      // Assert
      expect(parsedBody).toEqual(payload);
    });

    it('should echo back actionGroup and function from event', () => {
      // Arrange
      const customEvent: BedrockActionEvent = {
        actionGroup: 'custom-group',
        function: 'custom-function',
        parameters: [],
      };

      // Act
      const result = agentResponse.ok(customEvent, {});

      // Assert
      expect(result.response.actionGroup).toBe('custom-group');
      expect(result.response.function).toBe('custom-function');
    });
  });

  describe('agentResponse.error', () => {
    it('should create a properly formatted error response', () => {
      // Arrange
      const errorType = 'Validation error';
      const errorMessage = 'Field required: name';

      // Act
      const result = agentResponse.error(mockEvent, errorType, errorMessage);

      // Assert
      expect(result.response.actionGroup).toBe('plan');
      expect(result.response.function).toBe('write-plan-action');
      const body = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);
      expect(body.error).toBe(errorType);
      expect(body.message).toBe(errorMessage);
    });

    it('should include error and message fields', () => {
      // Arrange
      const errorType = 'Invalid parameters';
      const errorMessage = 'Missing required parameter: sessionId';

      // Act
      const result = agentResponse.error(mockEvent, errorType, errorMessage);
      const body = JSON.parse(result.response.functionResponse.responseBody.TEXT.body);

      // Assert
      expect(body).toHaveProperty('error', errorType);
      expect(body).toHaveProperty('message', errorMessage);
    });

    it('should conform to BedrockActionResponse type', () => {
      // Act
      const result = agentResponse.error(mockEvent, 'Error', 'Message');

      // Assert
      expect(result).toHaveProperty('response');
      expect(result.response).toHaveProperty('actionGroup');
      expect(result.response).toHaveProperty('function');
      expect(result.response).toHaveProperty('functionResponse');
      expect(result.response.functionResponse).toHaveProperty('responseBody');
      expect(result.response.functionResponse.responseBody).toHaveProperty('TEXT');
      expect(result.response.functionResponse.responseBody.TEXT).toHaveProperty('body');
      expect(typeof result.response.functionResponse.responseBody.TEXT.body).toBe('string');
    });
  });
});

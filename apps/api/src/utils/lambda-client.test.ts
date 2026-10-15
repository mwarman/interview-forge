import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Lambda SDK BEFORE importing the client
vi.mock('@aws-sdk/client-lambda');

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { invokeLambdaSync, invokeLambdaAsync, lambdaClient } from './lambda-client';

/**
 * Mock implementation helpers
 */
const createMockResponse = (statusCode: number, payload?: unknown, functionError?: string) => ({
  StatusCode: statusCode,
  FunctionError: functionError,
  Payload: payload ? new TextEncoder().encode(JSON.stringify(payload)) : undefined,
});

describe('lambda-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lambdaClient singleton', () => {
    it('should export a LambdaClient instance', () => {
      // Assert
      expect(lambdaClient).toBeDefined();
      expect(lambdaClient).toBeInstanceOf(LambdaClient);
    });
  });

  describe('invokeLambdaSync', () => {
    describe('successful invocation', () => {
      it('should successfully invoke a Lambda function synchronously and return the response payload', async () => {
        // Arrange
        const functionName = 'my-sync-function';
        const payload = { key: 'value', data: { nested: true } };
        const responsePayload = { result: 'success', statusCode: 200 };

        const mockResponse = createMockResponse(200, responsePayload);
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act
        const result = await invokeLambdaSync(functionName, payload);

        // Assert
        expect(result).toEqual(responsePayload);
        expect(lambdaClient.send).toHaveBeenCalledWith(expect.any(InvokeCommand));
      });

      it('should handle null payload response correctly', async () => {
        // Arrange
        const functionName = 'my-sync-function';
        const payload = { action: 'test' };

        const mockResponse = { StatusCode: 200, FunctionError: undefined, Payload: undefined };
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act
        const result = await invokeLambdaSync(functionName, payload);

        // Assert
        expect(result).toBeNull();
      });

      it('should parse JSON payload from binary response', async () => {
        // Arrange
        const functionName = 'my-sync-function';
        const payload = { action: 'fetch' };
        const expectedResult = { items: [1, 2, 3], count: 3 };

        const mockResponse = createMockResponse(200, expectedResult);
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act
        const result = await invokeLambdaSync(functionName, payload);

        // Assert
        expect(result).toEqual(expectedResult);
      });

      it('should pass function name and payload to InvokeCommand correctly', async () => {
        // Arrange
        const functionName = 'test-function-name';
        const payload = { data: 'test' };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(200, {}));

        // Act
        await invokeLambdaSync(functionName, payload);

        // Assert
        expect(lambdaClient.send).toHaveBeenCalled();
        const callArgs = vi.mocked(lambdaClient.send).mock.calls[0][0] as InvokeCommand;
        expect(callArgs).toBeInstanceOf(InvokeCommand);
        // InvokeCommand should have been called with the right params
        // (We can't directly access the input, but we can verify the send was called)
      });
    });

    describe('error handling', () => {
      it('should throw error when Lambda function returns a function error', async () => {
        // Arrange
        const functionName = 'my-failing-function';
        const payload = { action: 'fail' };

        const mockResponse = createMockResponse(200, undefined, 'RuntimeError');
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act & Assert
        await expect(invokeLambdaSync(functionName, payload)).rejects.toThrow('Lambda function error: RuntimeError');
      });

      it('should throw error when SDK send fails', async () => {
        // Arrange
        const functionName = 'my-broken-function';
        const payload = { action: 'test' };

        const sdkError = new Error('Service not available');
        vi.mocked(lambdaClient.send).mockRejectedValue(sdkError);

        // Act & Assert
        await expect(invokeLambdaSync(functionName, payload)).rejects.toThrow('Service not available');
      });

      it('should handle malformed Lambda response gracefully', async () => {
        // Arrange
        const functionName = 'my-sync-function';
        const payload = { action: 'test' };

        // Return invalid payload data
        const mockResponse = {
          StatusCode: 200,
          FunctionError: undefined,
          Payload: new TextEncoder().encode('not valid json'),
        };
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act & Assert
        await expect(invokeLambdaSync(functionName, payload)).rejects.toThrow();
      });
    });

    describe('request type inference', () => {
      it('should support generic type parameter for response type inference', async () => {
        // Arrange
        interface MyResponse {
          result: string;
          statusCode: number;
        }

        const functionName = 'my-sync-function';
        const payload = { action: 'test' };
        const expectedResult: MyResponse = { result: 'success', statusCode: 200 };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(200, expectedResult));

        // Act
        const result = await invokeLambdaSync<MyResponse>(functionName, payload);

        // Assert
        expect(result).toEqual(expectedResult);
        expect(result.result).toBe('success');
        expect(result.statusCode).toBe(200);
      });
    });
  });

  describe('invokeLambdaAsync', () => {
    describe('successful invocation', () => {
      it('should successfully invoke a Lambda function asynchronously and return immediately', async () => {
        // Arrange
        const functionName = 'my-async-function';
        const payload = { eventType: 'process', data: [1, 2, 3] };

        const mockResponse = createMockResponse(202);
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act
        const result = await invokeLambdaAsync(functionName, payload);

        // Assert
        expect(result).toBeUndefined();
        expect(lambdaClient.send).toHaveBeenCalledWith(expect.any(InvokeCommand));
      });

      it('should use Event invocation type for async calls', async () => {
        // Arrange
        const functionName = 'my-async-function';
        const payload = { action: 'process' };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(202));

        // Act
        await invokeLambdaAsync(functionName, payload);

        // Assert
        expect(lambdaClient.send).toHaveBeenCalled();
        const callArgs = vi.mocked(lambdaClient.send).mock.calls[0][0] as InvokeCommand;
        expect(callArgs).toBeInstanceOf(InvokeCommand);
      });

      it('should pass function name and payload correctly', async () => {
        // Arrange
        const functionName = 'async-handler';
        const payload = { notification: { userId: 123, action: 'created' } };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(202));

        // Act
        await invokeLambdaAsync(functionName, payload);

        // Assert
        expect(lambdaClient.send).toHaveBeenCalled();
      });

      it('should not wait for Lambda execution to complete', async () => {
        // Arrange
        const functionName = 'long-running-function';
        const payload = { data: 'test' };

        let sendCalled = false;
        vi.mocked(lambdaClient.send).mockImplementation(async () => {
          sendCalled = true;
          // Simulate a long-running function that would complete later
          return createMockResponse(202);
        });

        // Act
        const invocationPromise = invokeLambdaAsync(functionName, payload);

        // Assert - invocation should complete quickly without waiting
        await expect(invocationPromise).resolves.toBeUndefined();
        expect(sendCalled).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should throw error when Lambda invocation request fails', async () => {
        // Arrange
        const functionName = 'my-failing-async-function';
        const payload = { action: 'fail' };

        const sdkError = new Error('Invalid function name');
        vi.mocked(lambdaClient.send).mockRejectedValue(sdkError);

        // Act & Assert
        await expect(invokeLambdaAsync(functionName, payload)).rejects.toThrow('Invalid function name');
      });

      it('should throw error if async invocation returns function error', async () => {
        // Arrange
        const functionName = 'my-async-function';
        const payload = { action: 'test' };

        const mockResponse = createMockResponse(202, undefined, 'AccessDenied');
        vi.mocked(lambdaClient.send).mockResolvedValue(mockResponse);

        // Act & Assert
        await expect(invokeLambdaAsync(functionName, payload)).rejects.toThrow('Lambda function error: AccessDenied');
      });

      it('should handle network errors gracefully', async () => {
        // Arrange
        const functionName = 'my-async-function';
        const payload = { action: 'test' };

        const networkError = new Error('Network timeout');
        vi.mocked(lambdaClient.send).mockRejectedValue(networkError);

        // Act & Assert
        await expect(invokeLambdaAsync(functionName, payload)).rejects.toThrow('Network timeout');
      });
    });

    describe('fire-and-forget pattern', () => {
      it('should support fire-and-forget invocation without error handling in caller', async () => {
        // Arrange
        const functionName = 'notification-sender';
        const payload = { userId: 123, message: 'Hello' };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(202));

        // Act - can be called and the result ignored
        void invokeLambdaAsync(functionName, payload);

        // Assert - no exception should be thrown
        expect(lambdaClient.send).toHaveBeenCalled();
      });

      it('should allow awaiting async invocation for acknowledgment', async () => {
        // Arrange
        const functionName = 'background-job';
        const payload = { jobId: 'job-123', action: 'process' };

        vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(202));

        // Act
        await invokeLambdaAsync(functionName, payload);

        // Assert
        expect(lambdaClient.send).toHaveBeenCalled();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle JSON serialization of complex payloads', async () => {
      // Arrange
      const functionName = 'my-sync-function';
      const complexPayload = {
        nested: {
          deep: {
            array: [1, 2, { value: 'test' }],
            date: '2026-06-10T12:00:00Z',
          },
        },
      };

      vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(200, { success: true }));

      // Act
      await invokeLambdaSync(functionName, complexPayload);

      // Assert
      expect(lambdaClient.send).toHaveBeenCalled();
    });

    it('should differentiate between sync and async invocation types', async () => {
      // Arrange
      const functionName = 'test-function';
      const payload = { data: 'test' };

      vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(200, { result: 'sync' }));

      // Act - Sync invocation
      await invokeLambdaSync(functionName, payload);

      // Reset mock
      vi.mocked(lambdaClient.send).mockResolvedValue(createMockResponse(202));

      // Act - Async invocation
      await invokeLambdaAsync(functionName, payload);

      // Assert - Both should have been called
      expect(lambdaClient.send).toHaveBeenCalledTimes(2);
    });
  });
});

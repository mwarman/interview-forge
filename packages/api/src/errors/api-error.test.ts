import { describe, it, expect } from 'vitest';
import { APIError, BadRequestError, NotFoundError, ConflictError, InternalServerError } from './api-error';

describe('APIError', () => {
  describe('base APIError class', () => {
    it('should create an APIError with default statusCode 500', () => {
      // Arrange & Act
      const error = new APIError('Test error');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('APIError');
    });

    it('should create an APIError with custom statusCode', () => {
      // Arrange & Act
      const error = new APIError('Test error', 418);

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(418);
    });

    it('should have proper stack trace', () => {
      // Arrange & Act
      const error = new APIError('Test error');

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('APIError');
    });

    it('should be throwable and catchable', () => {
      // Arrange & Act & Assert
      expect(() => {
        throw new APIError('Throwable error', 503);
      }).toThrow(APIError);
    });
  });

  describe('BadRequestError', () => {
    it('should create a BadRequestError with 400 statusCode', () => {
      // Arrange & Act
      const error = new BadRequestError('Invalid input');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });

    it('should have default message', () => {
      // Arrange & Act
      const error = new BadRequestError();

      // Assert
      expect(error.message).toBe('Bad Request');
      expect(error.statusCode).toBe(400);
    });

    it('should be distinguishable from other APIError subclasses', () => {
      // Arrange
      const badRequestError = new BadRequestError('Bad request');
      const notFoundError = new NotFoundError('Not found');

      // Act & Assert
      expect(badRequestError instanceof BadRequestError).toBe(true);
      expect(badRequestError instanceof NotFoundError).toBe(false);
      expect(notFoundError instanceof BadRequestError).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with 404 statusCode', () => {
      // Arrange & Act
      const error = new NotFoundError('Resource not found');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should have default message', () => {
      // Arrange & Act
      const error = new NotFoundError();

      // Assert
      expect(error.message).toBe('Not Found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with 409 statusCode', () => {
      // Arrange & Act
      const error = new ConflictError('Resource conflict');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should have default message', () => {
      // Arrange & Act
      const error = new ConflictError();

      // Assert
      expect(error.message).toBe('Conflict');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with 500 statusCode', () => {
      // Arrange & Act
      const error = new InternalServerError('Server error occurred');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe('Server error occurred');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
    });

    it('should have default message', () => {
      // Arrange & Act
      const error = new InternalServerError();

      // Assert
      expect(error.message).toBe('Internal Server Error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('error discrimination using instanceof', () => {
    it('should allow catching specific error types', () => {
      // Arrange
      const errors = [
        new BadRequestError('bad'),
        new NotFoundError('not found'),
        new ConflictError('conflict'),
        new InternalServerError('internal'),
      ];

      // Act & Assert
      let badRequestCount = 0;
      let notFoundCount = 0;
      let conflictCount = 0;
      let internalCount = 0;

      for (const error of errors) {
        if (error instanceof BadRequestError) badRequestCount++;
        else if (error instanceof NotFoundError) notFoundCount++;
        else if (error instanceof ConflictError) conflictCount++;
        else if (error instanceof InternalServerError) internalCount++;
      }

      expect(badRequestCount).toBe(1);
      expect(notFoundCount).toBe(1);
      expect(conflictCount).toBe(1);
      expect(internalCount).toBe(1);
    });

    it('should catch all APIErrors with instanceof APIError', () => {
      // Arrange
      const errors: APIError[] = [
        new BadRequestError('bad'),
        new NotFoundError('not found'),
        new ConflictError('conflict'),
        new InternalServerError('internal'),
      ];

      // Act & Assert
      let apiErrorCount = 0;
      for (const error of errors) {
        if (error instanceof APIError) apiErrorCount++;
      }

      expect(apiErrorCount).toBe(4);
    });

    it('should not catch generic Error as APIError', () => {
      // Arrange
      const genericError = new Error('Generic error');

      // Act & Assert
      expect(genericError instanceof APIError).toBe(false);
    });
  });

  describe('error hierarchy', () => {
    it('should maintain proper inheritance chain', () => {
      // Arrange
      const error = new NotFoundError('test');

      // Act & Assert
      expect(error instanceof NotFoundError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should have correct error names in hierarchy', () => {
      // Arrange
      const errors = {
        badRequest: new BadRequestError(),
        notFound: new NotFoundError(),
        conflict: new ConflictError(),
        internalServer: new InternalServerError(),
      };

      // Act & Assert
      expect(errors.badRequest.name).toBe('BadRequestError');
      expect(errors.notFound.name).toBe('NotFoundError');
      expect(errors.conflict.name).toBe('ConflictError');
      expect(errors.internalServer.name).toBe('InternalServerError');
    });
  });

  describe('error serialization', () => {
    it('should include statusCode in serialization', () => {
      // Arrange
      const error = new NotFoundError('Resource missing');

      // Act
      const serialized = JSON.stringify({
        message: error.message,
        statusCode: error.statusCode,
        name: error.name,
      });

      // Assert
      expect(serialized).toContain('"statusCode":404');
      expect(serialized).toContain('"message":"Resource missing"');
      expect(serialized).toContain('"name":"NotFoundError"');
    });
  });

  describe('try/catch with instanceof discrimination', () => {
    it('should handle multiple error types in single try/catch', () => {
      // Arrange
      const testCases = [
        { error: new BadRequestError('bad input'), expectedStatus: 400 },
        { error: new NotFoundError('missing'), expectedStatus: 404 },
        { error: new ConflictError('conflict'), expectedStatus: 409 },
        { error: new InternalServerError('oops'), expectedStatus: 500 },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        try {
          throw testCase.error;
        } catch (error) {
          if (error instanceof BadRequestError) {
            expect(error.statusCode).toBe(testCase.expectedStatus);
          } else if (error instanceof NotFoundError) {
            expect(error.statusCode).toBe(testCase.expectedStatus);
          } else if (error instanceof ConflictError) {
            expect(error.statusCode).toBe(testCase.expectedStatus);
          } else if (error instanceof InternalServerError) {
            expect(error.statusCode).toBe(testCase.expectedStatus);
          }
        }
      }
    });
  });
});

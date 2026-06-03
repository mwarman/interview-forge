import { describe, it, expect } from 'vitest';
import { response } from './response';

describe('response helpers', () => {
  describe('ok', () => {
    it('should return a 200 response with body', () => {
      // Arrange
      const testData = { status: 'ok', id: 123 };

      // Act
      const result = response.ok(testData);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(testData));
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('accepted', () => {
    it('should return a 202 response with body', () => {
      // Arrange
      const testData = { taskId: 'task-123' };

      // Act
      const result = response.accepted(testData);

      // Assert
      expect(result.statusCode).toBe(202);
      expect(result.body).toBe(JSON.stringify(testData));
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('created', () => {
    it('should return a 201 response with body', () => {
      // Arrange
      const testData = { id: 'resource-123', name: 'New Resource' };

      // Act
      const result = response.created(testData);

      // Assert
      expect(result.statusCode).toBe(201);
      expect(result.body).toBe(JSON.stringify(testData));
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });

    it('should return a 201 response with various data types', () => {
      // Arrange
      const testData = { count: 42, active: true };

      // Act
      const result = response.created(testData);

      // Assert
      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body || '{}')).toEqual(testData);
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('noContent', () => {
    it('should return a 204 response with no body', () => {
      // Arrange & Act
      const result = response.noContent();

      // Assert
      expect(result.statusCode).toBe(204);
      expect(result.body).toBeUndefined();
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('badRequest', () => {
    it('should return a 400 response with error details', () => {
      // Arrange
      const error = 'Validation Error';
      const message = 'Invalid input provided';

      // Act
      const result = response.badRequest(error, message);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });

    it('should allow empty message', () => {
      // Arrange
      const error = 'Bad Request';

      // Act
      const result = response.badRequest(error);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe('');
    });
  });

  describe('unprocessableEntity', () => {
    it('should return a 422 response with default error', () => {
      // Arrange & Act
      const result = response.unprocessableEntity();

      // Assert
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Unprocessable Entity');
      expect(body.message).toBe('');
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });

    it('should return a 422 response with custom error', () => {
      // Arrange
      const error = 'Invalid Schema';

      // Act
      const result = response.unprocessableEntity(error);

      // Assert
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe('');
    });

    it('should return a 422 response with custom error and message', () => {
      // Arrange
      const error = 'Validation Failed';
      const message = 'Field validation failed: invalid email format';

      // Act
      const result = response.unprocessableEntity(error, message);

      // Assert
      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('notFound', () => {
    it('should return a 404 response with default error', () => {
      // Arrange & Act
      const result = response.notFound();

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('');
    });

    it('should return a 404 response with custom error and message', () => {
      // Arrange
      const error = 'Resource Not Found';
      const message = 'The requested resource does not exist';

      // Act
      const result = response.notFound(error, message);

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('conflict', () => {
    it('should return a 409 response with default error', () => {
      // Arrange & Act
      const result = response.conflict();

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Conflict');
      expect(body.message).toBe('');
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });

    it('should return a 409 response with custom error', () => {
      // Arrange
      const error = 'Resource Already Exists';

      // Act
      const result = response.conflict(error);

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe('');
    });

    it('should return a 409 response with custom error and message', () => {
      // Arrange
      const error = 'Duplicate Resource';
      const message = 'A resource with this identifier already exists';

      // Act
      const result = response.conflict(error, message);

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('tooManyRequests', () => {
    it('should return a 429 response with default error', () => {
      // Arrange & Act
      const result = response.tooManyRequests();

      // Assert
      expect(result.statusCode).toBe(429);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Too Many Requests');
    });

    it('should return a 429 response with custom error and message', () => {
      // Arrange
      const error = 'Rate Limit Exceeded';
      const message = 'Please retry after 60 seconds';

      // Act
      const result = response.tooManyRequests(error, message);

      // Assert
      expect(result.statusCode).toBe(429);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('internalServerError', () => {
    it('should return a 500 response with default error', () => {
      // Arrange & Act
      const result = response.internalServerError();

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Internal Server Error');
    });

    it('should return a 500 response with custom error and message', () => {
      // Arrange
      const error = 'Database Connection Failed';
      const message = 'Unable to connect to the database';

      // Act
      const result = response.internalServerError(error, message);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });

  describe('badGateway', () => {
    it('should return a 502 response with default error', () => {
      // Arrange & Act
      const result = response.badGateway();

      // Assert
      expect(result.statusCode).toBe(502);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe('Bad Gateway');
    });

    it('should return a 502 response with custom error and message', () => {
      // Arrange
      const error = 'External Service Unavailable';
      const message = 'The upstream service is not responding';

      // Act
      const result = response.badGateway(error, message);

      // Assert
      expect(result.statusCode).toBe(502);
      const body = JSON.parse(result.body || '{}');
      expect(body.error).toBe(error);
      expect(body.message).toBe(message);
    });
  });
});

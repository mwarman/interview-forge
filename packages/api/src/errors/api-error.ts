/**
 * Base API error class that other specific API errors can extend from.
 * Includes an HTTP status code for better error handling in API responses.
 */
export class APIError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * BadRequestError
 * Thrown when the client sends an invalid request, such as missing required parameters,
 * invalid data formats, or failed validation checks.
 * Results in a 400 Bad Request HTTP response.
 */
export class BadRequestError extends APIError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * NotFoundError
 * Thrown when the requested resource could not be found.
 * Results in a 404 Not Found HTTP response.
 */
export class NotFoundError extends APIError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

/**
 * ConflictError
 * Thrown when a request could not be completed due to a conflict with the current state of the resource.
 * Results in a 409 Conflict HTTP response.
 */
export class ConflictError extends APIError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

/**
 * InternalServerError
 * Thrown when an unexpected error occurs on the server.
 * Results in a 500 Internal Server Error HTTP response.
 */
export class InternalServerError extends APIError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

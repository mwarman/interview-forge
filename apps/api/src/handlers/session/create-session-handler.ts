import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { CreateSessionRequestSchema } from '@interview-forge/shared';
import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { parseBody, ValidationError } from '@/utils/validate';
import { sessionService } from '@/services/session-service';

/**
 * Create Session Handler - creates a new candidate session under a parent JD
 * Request: { jdId, candidateName }
 *
 * Responsibilities:
 * - Parse and validate incoming request
 * - Delegate to business service
 * - Return 404 if parent JD does not exist
 * - Handle service errors and return appropriate responses
 * - Format and return response to API Gateway
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[CreateSessionHandler] > handle');

    // Parse and validate request body
    let request;
    try {
      request = parseBody(CreateSessionRequestSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[CreateSessionHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request body validation failed');
      }
      throw error;
    }

    logger.debug(
      { jdId: request.jdId, candidateName: request.candidateName },
      '[CreateSessionHandler] - Creating session',
    );

    // Delegate to service to create session
    const createdSession = await sessionService.createSession(request.jdId, request.candidateName);

    // Return 404 if parent JD not found
    if (!createdSession) {
      logger.info({ jdId: request.jdId }, '[CreateSessionHandler] - Parent job description not found');
      return response.notFound(
        'Parent Job Description Not Found',
        `Job description with ID ${request.jdId} does not exist`,
      );
    }

    logger.info({ sessionId: createdSession.sessionId }, '[CreateSessionHandler] < handle');

    return response.created(createdSession);
  } catch (error) {
    // Unhandled errors
    logger.error({ error }, '[CreateSessionHandler] - Unhandled error');
    return response.internalServerError('Processing Error', 'An unexpected error occurred while creating the session');
  }
};

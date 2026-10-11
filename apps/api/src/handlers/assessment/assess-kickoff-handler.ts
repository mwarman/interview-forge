import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { assessService } from '@/services/assess-service';
import { APIError, NotFoundError, ConflictError } from '@/errors/api-error';

/**
 * Assess Kickoff Handler - initiates async assessment generation for a session
 * Request: POST /jds/{jdId}/sessions/{sessionId}/assessment
 *
 * Responsibilities:
 * - Extract and validate jdId and sessionId from path parameters
 * - Invoke the assess kickoff service (which orchestrates async worker invocation)
 * - Return HTTP 200 with updated session immediately (do not wait for worker completion)
 * - Handle service-specific errors and return appropriate responses
 *
 * Error responses:
 * - 400: Invalid path parameters
 * - 404: Session not found
 * - 409: Session status not valid for assessment generation kickoff
 * - 500: Internal server error
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[AssessKickoffHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    // Validate path parameters
    if (!jdId) {
      logger.warn('[AssessKickoffHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[AssessKickoffHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    logger.debug({ jdId, sessionId }, '[AssessKickoffHandler] - Invoking assess kickoff service');

    // Invoke assess kickoff service which handles:
    // - Session validation
    // - Status update to ASSESS_GENERATING
    // - Async assess-worker Lambda invocation
    const updatedSession = await assessService.kickoffAssessmentGeneration(jdId, sessionId);

    logger.info({ jdId, sessionId }, '[AssessKickoffHandler] < handle');
    return response.ok(updatedSession);
  } catch (error) {
    // Handle specific error types thrown by service
    if (error instanceof NotFoundError) {
      logger.warn(
        { error: error.message, jdId: event.pathParameters?.jdId, sessionId: event.pathParameters?.sessionId },
        '[AssessKickoffHandler] - Session not found',
      );
      return response.notFound('Not Found', error.message);
    }

    if (error instanceof ConflictError) {
      logger.warn(
        { error: error.message, jdId: event.pathParameters?.jdId, sessionId: event.pathParameters?.sessionId },
        '[AssessKickoffHandler] - Session status invalid for assessment generation',
      );
      return response.conflict(
        'Conflict',
        'Session status is not valid for assessment generation. Session may already be assessed or in progress.',
      );
    }

    if (error instanceof APIError) {
      logger.error({ error }, '[AssessKickoffHandler] - API error');
      const statusCode = error.statusCode || 500;
      if (statusCode === 400) return response.badRequest(error.name, error.message);
      if (statusCode === 404) return response.notFound(error.name, error.message);
      if (statusCode === 409) return response.conflict(error.name, error.message);
      return response.internalServerError(error.name, error.message);
    }

    // Unhandled errors
    logger.error({ error }, '[AssessKickoffHandler] - Unhandled error');
    return response.internalServerError(
      'Unexpected Error',
      'An unexpected error occurred while processing your request',
    );
  }
};

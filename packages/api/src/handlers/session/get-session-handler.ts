import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { sessionService } from '@/services/session-service';

/**
 * Get Session Handler - returns a single session by ID and parent JD ID
 * Including any attached plan, scorecard, and assessment
 *
 * Responsibilities:
 * - Extract jdId and sessionId from path parameters
 * - Validate that both parameters are provided
 * - Retrieve session from service
 * - Return 200 on success, 404 if not found, 400 if invalid parameters
 * - Handle service errors appropriately
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[GetSessionHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    if (!jdId) {
      logger.warn('[GetSessionHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[GetSessionHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    const session = await sessionService.getById(jdId, sessionId);

    if (!session) {
      logger.info({ jdId, sessionId }, '[GetSessionHandler] - Session not found');
      return response.notFound('Not Found', `Session with ID ${sessionId} under job description ${jdId} not found`);
    }

    logger.info({ jdId, sessionId }, '[GetSessionHandler] < handle');
    return response.ok(session);
  } catch (error) {
    logger.error({ error }, '[GetSessionHandler] - Unhandled error');
    return response.internalServerError('Retrieval Error', 'An unexpected error occurred while retrieving the session');
  }
};

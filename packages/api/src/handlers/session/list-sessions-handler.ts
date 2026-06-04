import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { sessionService } from '@/services/session-service';

/**
 * List Sessions Handler - returns all sessions for a given JD sorted by createdAt ascending
 *
 * Responsibilities:
 * - Handle GET /jds/{jdId}/sessions requests
 * - Extract jdId from path parameters
 * - Retrieve all sessions for the JD from service
 * - Format and return response to API Gateway
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[ListSessionsHandler] > handle');

    // Extract jdId from path parameters
    const jdId = event.pathParameters?.jdId;

    if (!jdId) {
      logger.warn('[ListSessionsHandler] - Missing jdId in path parameters');
      return response.badRequest('Missing Parameter', 'Path parameter "jdId" is required');
    }

    logger.debug({ jdId }, '[ListSessionsHandler] - Retrieving sessions');

    const sessions = await sessionService.listByJdId(jdId);

    logger.info({ jdId, count: sessions.length }, '[ListSessionsHandler] < handle');

    return response.ok(sessions);
  } catch (error) {
    logger.error({ error }, '[ListSessionsHandler] - Unhandled error');
    return response.internalServerError('List Error', 'An unexpected error occurred while retrieving sessions');
  }
};

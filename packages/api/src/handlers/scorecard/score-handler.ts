import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import { ScorecardSchema } from '@interview-forge/shared';
import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { parseBody, ValidationError } from '@/utils/validate';
import { sessionService } from '@/services/session-service';

/**
 * Score Handler - writes a scorecard to a session
 * Request: POST /jds/{jdId}/sessions/{sessionId}/scorecard
 * Body: Scorecard object
 *
 * Responsibilities:
 * - Extract and validate path parameters (jdId, sessionId)
 * - Parse and validate request body against ScorecardSchema
 * - Delegate to business service to update scorecard
 * - Return 409 if the session status is already ASSESSED or COMPLETE (terminal states)
 * - Return 200 with updated full session on success
 * - Handle validation and service errors appropriately
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[ScoreHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    // Validate path parameters
    if (!jdId) {
      logger.warn('[ScoreHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[ScoreHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    // Parse and validate request body against ScorecardSchema
    let scorecard;
    try {
      scorecard = parseBody(ScorecardSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[ScoreHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request validation failed');
      }
      throw error;
    }

    logger.debug({ jdId, sessionId }, '[ScoreHandler] - Scorecard validated, updating session');

    // Delegate to service to update scorecard
    const updatedSession = await sessionService.updateScorecard(jdId, sessionId, scorecard);

    logger.info({ jdId, sessionId }, '[ScoreHandler] < handle');
    return response.ok(updatedSession);
  } catch (error) {
    // Handle DynamoDB condition check failure (status already in terminal state)
    if (error instanceof ConditionalCheckFailedException) {
      logger.info({ error }, '[ScoreHandler] - Condition check failed (status is terminal)');
      return response.conflict('Conflict', 'This session scorecard has already been assessed and cannot be updated');
    }

    // Unhandled errors
    logger.error({ error }, '[ScoreHandler] - Unhandled error');
    return response.internalServerError('Scorecard Error', 'An unexpected error occurred while saving the scorecard');
  }
};

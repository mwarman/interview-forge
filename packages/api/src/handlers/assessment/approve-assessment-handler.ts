import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import { ApproveAssessmentRequestSchema } from '@interview-forge/shared';
import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { parseBody, ValidationError } from '@/utils/validate';
import { sessionService } from '@/services/session-service';

/**
 * Approve Assessment Handler - approves a session's assessment with optional overrides
 * Request: PUT /jds/{jdId}/sessions/{sessionId}/assessment/approve
 * Body: { overrideRecommendation?: Recommendation, overrideReasoning?: string }
 *
 * Responsibilities:
 * - Extract and validate path parameters (jdId, sessionId)
 * - Parse and validate request body (optional overrideRecommendation and overrideReasoning)
 * - Delegate to business service to approve the assessment
 * - Return 409 if the session status is not ASSESSED (idempotency guard)
 * - Return 200 with updated session on success
 * - Handle validation and service errors appropriately
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[ApproveAssessmentHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    // Validate path parameters
    if (!jdId) {
      logger.warn('[ApproveAssessmentHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[ApproveAssessmentHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    // Parse and validate request body
    let request;
    try {
      request = parseBody(ApproveAssessmentRequestSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[ApproveAssessmentHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request validation failed');
      }
      throw error;
    }

    logger.debug(
      {
        jdId,
        sessionId,
        hasOverrideRecommendation: !!request.overrideRecommendation,
        hasOverrideReasoning: !!request.overrideReasoning,
      },
      '[ApproveAssessmentHandler] - Approving assessment',
    );

    // Build overrides object only if fields are provided
    const overrides = request.overrideRecommendation || request.overrideReasoning ? request : undefined;

    // Delegate to service to approve assessment
    const updatedSession = await sessionService.approveAssessment(jdId, sessionId, overrides);

    logger.info({ jdId, sessionId }, '[ApproveAssessmentHandler] < handle');
    return response.ok(updatedSession);
  } catch (error) {
    // Handle DynamoDB condition check failure (status not ASSESSED)
    if (error instanceof ConditionalCheckFailedException) {
      logger.info({ error }, '[ApproveAssessmentHandler] - Condition check failed (status not ASSESSED)');
      return response.conflict(
        'Conflict',
        'This session assessment cannot be approved. Session may not be in ASSESSED state.',
      );
    }

    // Handle general errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Check for session not found
      if (errorMessage.includes('session not found')) {
        logger.warn({ error }, '[ApproveAssessmentHandler] - Session not found');
        return response.notFound('Not Found', 'Session not found');
      }

      // Check for assessment not found
      if (errorMessage.includes('assessment not found')) {
        logger.warn({ error }, '[ApproveAssessmentHandler] - Assessment not found in session');
        return response.conflict('Conflict', 'Assessment not found in session. Session may not be fully assessed.');
      }
    }

    // Unhandled errors
    logger.error({ error }, '[ApproveAssessmentHandler] - Unhandled error');
    return response.internalServerError(
      'Approval Error',
      'An unexpected error occurred while approving the assessment',
    );
  }
};

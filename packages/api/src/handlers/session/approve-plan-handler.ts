import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import { ApprovePlanRequestSchema } from '@interview-forge/shared';
import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { parseBody, ValidationError } from '@/utils/validate';
import { sessionService } from '@/services/session-service';

/**
 * Approve Plan Handler - approves a session's interview plan
 * Request: PUT /jds/{jdId}/sessions/{sessionId}/plan/approve
 * Body: { plan?: InterviewPlan }
 *
 * Responsibilities:
 * - Extract and validate path parameters (jdId, sessionId)
 * - Parse and validate request body (single validation covering optional plan field)
 * - Delegate to business service to approve the plan
 * - Return 409 if the session status is already PLAN_APPROVED or beyond (idempotency guard)
 * - Return 200 with updated session on success
 * - Handle validation and service errors appropriately
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[ApprovePlanHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    // Validate path parameters
    if (!jdId) {
      logger.warn('[ApprovePlanHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[ApprovePlanHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    // Parse and validate request body (covers optional plan field with InterviewPlanSchema)
    let request;
    try {
      request = parseBody(ApprovePlanRequestSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[ApprovePlanHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request validation failed');
      }
      throw error;
    }

    logger.debug({ jdId, sessionId, hasPlan: !!request.plan }, '[ApprovePlanHandler] - Approving plan');

    // Delegate to service to approve plan
    const updatedSession = await sessionService.approvePlan(jdId, sessionId, request);

    logger.info({ jdId, sessionId }, '[ApprovePlanHandler] < handle');
    return response.ok(updatedSession);
  } catch (error) {
    // Handle DynamoDB condition check failure (status already approved or beyond)
    if (error instanceof ConditionalCheckFailedException) {
      logger.info({ error }, '[ApprovePlanHandler] - Condition check failed (status already approved)');
      return response.conflict('Conflict', 'This session plan has already been approved and cannot be updated');
    }

    // Unhandled errors
    logger.error({ error }, '[ApprovePlanHandler] - Unhandled error');
    return response.internalServerError('Approval Error', 'An unexpected error occurred while approving the plan');
  }
};

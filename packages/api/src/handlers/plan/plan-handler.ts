import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { planService } from '@/services/plan-service';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';

/**
 * Plan Handler - generates an interview plan for a session using Bedrock Agent
 * Request: POST /jds/{jdId}/sessions/{sessionId}/plan
 *
 * Responsibilities:
 * - Extract and validate jdId and sessionId from path parameters
 * - Invoke the plan generation service
 * - Handle service-specific errors and return appropriate responses
 * - Return the generated plan with 200 OK on success
 * - Return 502 if agent completes without writing plan
 * - Return 500 for agent/service errors
 * - Log agent invocation duration at info level
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[PlanHandler] > handle');

    // Extract jdId and sessionId from path parameters
    const jdId = event.pathParameters?.jdId;
    const sessionId = event.pathParameters?.sessionId;

    // Validate path parameters
    if (!jdId) {
      logger.warn('[PlanHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    if (!sessionId) {
      logger.warn('[PlanHandler] - Missing sessionId parameter');
      return response.badRequest('Invalid Request', 'sessionId path parameter is required');
    }

    logger.debug({ jdId, sessionId }, '[PlanHandler] - Invoking plan generation service');

    // Invoke plan generation service
    const session = await planService.generatePlan(jdId, sessionId);

    logger.info({ jdId, sessionId }, '[PlanHandler] < handle');
    return response.ok(session);
  } catch (error) {
    // Handle specific service errors
    if (error instanceof PlanNotWrittenError) {
      logger.warn(
        { jdId: error.jdId, sessionId: error.sessionId },
        '[PlanHandler] - Agent completed without writing plan',
      );
      return response.badGateway(
        'Plan Generation Failed',
        'The interview plan agent did not generate a plan. Please try again.',
      );
    }

    if (error instanceof AgentInvocationError) {
      logger.error(
        { error: error.cause, jdId: error.jdId, sessionId: error.sessionId },
        '[PlanHandler] - Agent invocation failed',
      );
      return response.internalServerError(
        'Plan Generation Error',
        'An error occurred while generating the interview plan. Please try again.',
      );
    }

    // Unhandled errors
    logger.error({ error }, '[PlanHandler] - Unhandled error');
    return response.internalServerError(
      'Unexpected Error',
      'An unexpected error occurred while processing your request',
    );
  }
};

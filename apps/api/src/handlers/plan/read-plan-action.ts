import { BedrockActionEvent, BedrockActionResponse } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { extractRequiredParameter } from '@/utils/agent-request';
import { agentResponse } from '@/utils/agent-response';
import { readPlanActionEventSchema, type ReadPlanActionEvent } from '@/schemas/read-plan-schema';
import { sessionService } from '@/services/session-service';

/**
 * Read Plan Action - Bedrock Agents action group Lambda handler
 *
 * Invoked by Bedrock Agents to read an interview plan from a session in DynamoDB.
 * Returns the session's interview plan in Bedrock action group response format.
 *
 * Event contract: { actionGroup, function, parameters }
 * Response contract: { actionGroup, function, functionResponse: { responseBody: { TEXT: { body: JSON string } } } }
 *
 * Parameters:
 * - jdId: The ID of the parent job description
 * - sessionId: The ID of the session to retrieve
 *
 * Responsibilities:
 * - Validate Bedrock action group event structure using schema
 * - Extract and validate jdId and sessionId parameters using schema
 * - Retrieve session using service layer
 * - Return error response if session not found or plan is missing
 * - Return structured Bedrock response with interview plan
 */
export const handle = async (event: unknown): Promise<BedrockActionResponse> => {
  logger.info('[ReadPlanAction] > handle');
  logger.debug({ event }, '[ReadPlanAction] - Received event');

  try {
    // Validate Bedrock event structure against schema
    logger.debug('[ReadPlanAction] - Validating Bedrock action event');
    const eventValidation = readPlanActionEventSchema.safeParse(event);

    if (!eventValidation.success) {
      // Request invalid - return error response with details
      logger.warn('[ReadPlanAction] - Invalid Bedrock event structure');
      return agentResponse.error(
        event as BedrockActionEvent,
        'Invalid event structure',
        'Event must have actionGroup, function, and parameters',
      );
    }

    // Request valid - extract parameters
    const bedrockEvent: ReadPlanActionEvent = eventValidation.data;
    logger.debug('[ReadPlanAction] - Event structure validated');

    // Extract jdId and sessionId from parameters
    logger.debug('[ReadPlanAction] - Extracting jdId and sessionId parameters');
    const jdId = extractRequiredParameter(bedrockEvent.parameters, 'jdId');
    const sessionId = extractRequiredParameter(bedrockEvent.parameters, 'sessionId');

    // Fetch session from service
    logger.debug({ jdId, sessionId }, '[ReadPlanAction] - Fetching session');
    const session = await sessionService.getById(jdId, sessionId);

    if (!session) {
      logger.warn({ jdId, sessionId }, '[ReadPlanAction] < handle - Session not found');
      return agentResponse.error(bedrockEvent, 'Not Found', `Session with ID ${sessionId} not found`);
    }

    logger.debug({ jdId, sessionId }, '[ReadPlanAction] - Session retrieved');

    // Check if plan exists on session
    if (!session.plan || Object.keys(session.plan).length === 0) {
      logger.warn({ jdId, sessionId }, '[ReadPlanAction] < handle - Plan not found on session');
      return agentResponse.error(
        bedrockEvent,
        'Not Found',
        `Plan not available for session ${sessionId}. Session status is ${session.status}`,
      );
    }

    logger.info({ jdId, sessionId }, '[ReadPlanAction] < handle - Plan retrieved successfully');

    // Build response payload
    const responsePayload = session.plan;

    logger.debug({ jdId, sessionId }, '[ReadPlanAction] < handle');
    return agentResponse.ok(bedrockEvent, responsePayload);
  } catch (error) {
    // Handle unexpected errors gracefully
    logger.error({ error }, '[ReadPlanAction] - Unhandled error');
    return agentResponse.error(
      event as BedrockActionEvent,
      'Internal Server Error',
      'An unexpected error occurred while reading the plan',
    );
  }
};

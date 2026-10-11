import { BedrockActionEvent, BedrockActionResponse } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { extractRequiredParameter } from '@/utils/agent-request';
import { agentResponse } from '@/utils/agent-response';
import { readScorecardActionEventSchema, type ReadScorecardActionEvent } from '@/schemas/read-scorecard-schema';
import { sessionService } from '@/services/session-service';

/**
 * Read Scorecard Action - Bedrock Agents action group Lambda handler
 *
 * Invoked by Bedrock Agents to read a scorecard from a session in DynamoDB.
 * Returns the session's scorecard in Bedrock action group response format.
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
 * - Return error response if session not found or scorecard is missing
 * - Return structured Bedrock response with scorecard
 */
export const handle = async (event: unknown): Promise<BedrockActionResponse> => {
  logger.info('[ReadScorecardAction] > handle');
  logger.debug({ event }, '[ReadScorecardAction] - Received event');

  try {
    // Validate Bedrock event structure against schema
    logger.debug('[ReadScorecardAction] - Validating Bedrock action event');
    const eventValidation = readScorecardActionEventSchema.safeParse(event);

    if (!eventValidation.success) {
      // Request invalid - return error response with details
      logger.warn('[ReadScorecardAction] - Invalid Bedrock event structure');
      return agentResponse.error(
        event as BedrockActionEvent,
        'Invalid event structure',
        'Event must have actionGroup, function, and parameters',
      );
    }

    // Request valid - extract parameters
    const bedrockEvent: ReadScorecardActionEvent = eventValidation.data;
    logger.debug('[ReadScorecardAction] - Event structure validated');

    // Extract jdId and sessionId from parameters
    logger.debug('[ReadScorecardAction] - Extracting jdId and sessionId parameters');
    const jdId = extractRequiredParameter(bedrockEvent.parameters, 'jdId');
    const sessionId = extractRequiredParameter(bedrockEvent.parameters, 'sessionId');

    // Fetch session from service
    logger.debug({ jdId, sessionId }, '[ReadScorecardAction] - Fetching session');
    const session = await sessionService.getById(jdId, sessionId);

    if (!session) {
      logger.warn({ jdId, sessionId }, '[ReadScorecardAction] < handle - Session not found');
      return agentResponse.error(bedrockEvent, 'Not Found', `Session with ID ${sessionId} not found`);
    }

    logger.debug({ jdId, sessionId }, '[ReadScorecardAction] - Session retrieved');

    // Check if scorecard exists on session
    if (!session.scorecard || Object.keys(session.scorecard).length === 0) {
      logger.warn({ jdId, sessionId }, '[ReadScorecardAction] < handle - Scorecard not found on session');
      return agentResponse.error(
        bedrockEvent,
        'Not Found',
        `Scorecard not available for session ${sessionId}. Session status is ${session.status}`,
      );
    }

    logger.info({ jdId, sessionId }, '[ReadScorecardAction] < handle - Scorecard retrieved successfully');

    // Build response payload
    const responsePayload = session.scorecard;

    logger.debug({ jdId, sessionId }, '[ReadScorecardAction] < handle');
    return agentResponse.ok(bedrockEvent, responsePayload);
  } catch (error) {
    // Handle unexpected errors gracefully
    logger.error({ error }, '[ReadScorecardAction] - Unhandled error');
    return agentResponse.error(
      event as BedrockActionEvent,
      'Internal Server Error',
      'An unexpected error occurred while reading the scorecard',
    );
  }
};

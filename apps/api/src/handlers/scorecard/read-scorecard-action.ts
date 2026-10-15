import { logger } from '@/utils/logger';
import { toolArgsError, toolError, type ToolErrorResult } from '@/utils/tool-result';
import { readScorecardArgsSchema } from '@/schemas/read-scorecard-schema';
import { sessionService } from '@/services/session-service';

/**
 * ReadScorecard Action - AgentCore gateway tool Lambda handler
 *
 * Invoked by an AgentCore gateway to read the scorecard from a session in DynamoDB.
 * Returns the session's scorecard.
 *
 * Event contract: flat tool arguments { jdId, sessionId }
 * Response contract: the scorecard JSON, or { error, message } when the tool fails
 *
 * Responsibilities:
 * - Validate the tool arguments using schema
 * - Retrieve session using service layer
 * - Return error result if session not found or scorecard is missing
 */
export const handle = async (event: unknown): Promise<Record<string, unknown> | ToolErrorResult> => {
  logger.info('[ReadScorecardAction] > handle');
  logger.debug({ event }, '[ReadScorecardAction] - Received event');

  try {
    const validation = readScorecardArgsSchema.safeParse(event);

    if (!validation.success) {
      logger.warn('[ReadScorecardAction] - Invalid tool arguments');
      return toolArgsError(validation.error);
    }

    const { jdId, sessionId } = validation.data;

    logger.debug({ jdId, sessionId }, '[ReadScorecardAction] - Fetching session');
    const session = await sessionService.getById(jdId, sessionId);

    if (!session) {
      logger.warn({ jdId, sessionId }, '[ReadScorecardAction] < handle - Session not found');
      return toolError('Not Found', `Session with ID ${sessionId} not found`);
    }

    const scorecard = session.scorecard;
    if (!scorecard || Object.keys(scorecard).length === 0) {
      logger.warn({ jdId, sessionId }, '[ReadScorecardAction] < handle - scorecard not found on session');
      return toolError(
        'Not Found',
        `Scorecard not available for session ${sessionId}. Session status is ${session.status}`,
      );
    }

    logger.info({ jdId, sessionId }, '[ReadScorecardAction] < handle - scorecard retrieved successfully');
    return scorecard;
  } catch (error) {
    logger.error({ error }, '[ReadScorecardAction] - Unhandled error');
    return toolError('Internal Server Error', 'An unexpected error occurred while reading the scorecard');
  }
};

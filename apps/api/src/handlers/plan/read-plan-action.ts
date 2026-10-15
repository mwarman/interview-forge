import { logger } from '@/utils/logger';
import { toolArgsError, toolError, type ToolErrorResult } from '@/utils/tool-result';
import { readPlanArgsSchema } from '@/schemas/read-plan-schema';
import { sessionService } from '@/services/session-service';

/**
 * ReadPlan Action - AgentCore gateway tool Lambda handler
 *
 * Invoked by an AgentCore gateway to read the plan from a session in DynamoDB.
 * Returns the session's plan.
 *
 * Event contract: flat tool arguments { jdId, sessionId }
 * Response contract: the plan JSON, or { error, message } when the tool fails
 *
 * Responsibilities:
 * - Validate the tool arguments using schema
 * - Retrieve session using service layer
 * - Return error result if session not found or plan is missing
 */
export const handle = async (event: unknown): Promise<Record<string, unknown> | ToolErrorResult> => {
  logger.info('[ReadPlanAction] > handle');
  logger.debug({ event }, '[ReadPlanAction] - Received event');

  try {
    const validation = readPlanArgsSchema.safeParse(event);

    if (!validation.success) {
      logger.warn('[ReadPlanAction] - Invalid tool arguments');
      return toolArgsError(validation.error);
    }

    const { jdId, sessionId } = validation.data;

    logger.debug({ jdId, sessionId }, '[ReadPlanAction] - Fetching session');
    const session = await sessionService.getById(jdId, sessionId);

    if (!session) {
      logger.warn({ jdId, sessionId }, '[ReadPlanAction] < handle - Session not found');
      return toolError('Not Found', `Session with ID ${sessionId} not found`);
    }

    const plan = session.plan;
    if (!plan || Object.keys(plan).length === 0) {
      logger.warn({ jdId, sessionId }, '[ReadPlanAction] < handle - plan not found on session');
      return toolError('Not Found', `Plan not available for session ${sessionId}. Session status is ${session.status}`);
    }

    logger.info({ jdId, sessionId }, '[ReadPlanAction] < handle - plan retrieved successfully');
    return plan;
  } catch (error) {
    logger.error({ error }, '[ReadPlanAction] - Unhandled error');
    return toolError('Internal Server Error', 'An unexpected error occurred while reading the plan');
  }
};

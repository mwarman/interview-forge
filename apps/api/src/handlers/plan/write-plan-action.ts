import { InterviewPlanSchema, type InterviewPlan } from '@interview-forge/shared';
import { ZodError } from 'zod';

import { logger } from '@/utils/logger';
import { toolArgsError, toolError, type ToolErrorResult } from '@/utils/tool-result';
import { writePlanArgsSchema } from '@/schemas/write-plan-schema';
import { sessionService } from '@/services/session-service';

/**
 * Successful result of the write-plan tool
 */
interface WritePlanResult {
  sessionId: string;
  status: string;
  message: string;
}

/**
 * WritePlan Action - AgentCore gateway tool Lambda handler
 *
 * Invoked by an AgentCore gateway to write an interview plan to a session.
 * Validates the plan against InterviewPlanSchema and updates the session with the plan and status=PLAN_GENERATED.
 *
 * Event contract: flat tool arguments { sessionId, jdId, plan } where plan is a serialized JSON string
 * Response contract: JSON result, or { error, message } when the tool fails
 *
 * Responsibilities:
 * - Validate the tool arguments using schema
 * - Parse plan JSON string
 * - Validate plan against InterviewPlanSchema
 * - Update session with plan and status=PLAN_GENERATED
 * - Return success result or validation error result
 */
export const handle = async (event: unknown): Promise<WritePlanResult | ToolErrorResult> => {
  logger.info('[WritePlanAction] > handle');
  logger.debug({ event }, '[WritePlanAction] - Received event');

  try {
    const validation = writePlanArgsSchema.safeParse(event);

    if (!validation.success) {
      logger.warn('[WritePlanAction] - Invalid tool arguments');
      return toolArgsError(validation.error);
    }

    const { jdId, sessionId, plan: planJsonString } = validation.data;

    logger.debug('[WritePlanAction] - Parsing plan JSON string and validating against schema');
    let plan: InterviewPlan;
    try {
      plan = InterviewPlanSchema.parse(JSON.parse(planJsonString));
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        logger.warn({ errorMessage: validationMessage }, '[WritePlanAction] - Plan JSON failed schema validation');
        return toolError('Invalid plan format', `Plan JSON validation failed: ${validationMessage}`);
      }
      logger.warn({ error }, '[WritePlanAction] - Failed to parse plan JSON string');
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
      return toolError('Invalid plan format', `plan parameter must be a valid JSON string: ${errorMessage}`);
    }

    logger.debug({ sessionId, jdId }, '[WritePlanAction] - Updating session with plan');
    const updatedSession = await sessionService.updateSession(jdId, sessionId, {
      plan,
      status: 'PLAN_GENERATED',
    });

    logger.info({ sessionId, jdId }, '[WritePlanAction] < handle - Session updated successfully');
    return {
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      message: 'Plan written successfully',
    };
  } catch (error) {
    logger.error({ error }, '[WritePlanAction] - Unhandled error');
    return toolError('Internal Server Error', 'An unexpected error occurred while writing the plan');
  }
};

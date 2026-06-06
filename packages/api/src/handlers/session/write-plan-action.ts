import {
  BedrockActionEvent,
  BedrockActionResponse,
  InterviewPlanSchema,
  type InterviewPlan,
} from '@interview-forge/shared';
import { ZodError } from 'zod';

import { logger } from '@/utils/logger';
import { WritePlanActionEvent, writePlanActionEventSchema } from '@/schemas/write-plan-schema';
import { agentResponse } from '@/utils/agent-response';
import { extractRequiredParameter } from '@/utils/agent-request';
import { sessionService } from '@/services/session-service';

/**
 * Write Plan Action - Bedrock Agents action group Lambda handler
 *
 * Invoked by Bedrock Agents to write an interview plan to a session.
 * Validates the plan against InterviewPlanSchema and updates the session with the plan and status=PLAN_PENDING.
 *
 * Event contract: { actionGroup, function, parameters }
 * Response contract: { actionGroup, function, functionResponse: { responseBody: { TEXT: { body: JSON string } } } }
 *
 * Parameters:
 * - sessionId: The ID of the session to update
 * - jdId: The ID of the parent job description
 * - plan: Serialized JSON string of the interview plan
 *
 * Responsibilities:
 * - Validate Bedrock action group event structure using schema
 * - Extract and validate required parameters using schemas
 * - Parse plan JSON string
 * - Validate plan against InterviewPlanSchema
 * - Update session with plan and status=PLAN_PENDING
 * - Return structured Bedrock response with success or validation error
 */
export const handle = async (event: unknown): Promise<BedrockActionResponse> => {
  logger.info('[WritePlanAction] > handle');
  logger.debug({ event }, '[WritePlanAction] - Received event');

  try {
    // Validate Bedrock event structure against schema
    logger.debug('[WritePlanAction] - Validating Bedrock action event');
    const eventValidation = writePlanActionEventSchema.safeParse(event);

    if (!eventValidation.success) {
      // Request invalid - return error response with details
      logger.warn('[WritePlanAction] - Invalid Bedrock event structure');
      return agentResponse.error(
        event as BedrockActionEvent,
        'Invalid event structure',
        'Event must have actionGroup, function, and parameters',
      );
    }

    // Request valid - extract parameters
    const bedrockEvent: WritePlanActionEvent = eventValidation.data;
    logger.debug('[WritePlanAction] - Event structure validated');

    // Extract parameters
    logger.debug('[WritePlanAction] - Extracting parameters');
    const jdId = extractRequiredParameter(bedrockEvent.parameters, 'jdId');
    const sessionId = extractRequiredParameter(bedrockEvent.parameters, 'sessionId');
    const planJsonString = extractRequiredParameter(bedrockEvent.parameters, 'plan');

    logger.debug({ sessionId, jdId }, '[WritePlanAction] - Parameters validated');

    // Parse and validate plan JSON string
    logger.debug('[WritePlanAction] - Parsing plan JSON string and validating against schema');
    let plan: InterviewPlan;
    try {
      const parsedPlan = JSON.parse(planJsonString!);
      logger.debug('[WritePlanAction] - Plan JSON parsed successfully');

      // Validate plan against InterviewPlanSchema
      plan = InterviewPlanSchema.parse(parsedPlan);
      logger.debug('[WritePlanAction] - Validated plan against schema');
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        logger.warn({ errorMessage: validationMessage }, '[WritePlanAction] - Plan JSON failed schema validation');
        return agentResponse.error(
          bedrockEvent,
          'Invalid plan format',
          `Plan JSON validation failed: ${validationMessage}`,
        );
      }
      logger.warn({ error }, '[WritePlanAction] - Failed to parse plan JSON string');
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
      return agentResponse.error(
        bedrockEvent,
        'Invalid plan format',
        `plan parameter must be a valid JSON string: ${errorMessage}`,
      );
    }

    // Plan is valid - Update session with plan and status
    logger.debug({ sessionId, jdId }, '[WritePlanAction] - Updating session with plan');
    const updatedSession = await sessionService.updateSession(jdId, sessionId, {
      plan,
      status: 'PLAN_PENDING',
    });

    logger.info({ sessionId, jdId }, '[WritePlanAction] - Session updated successfully');

    // Build response payload
    const responsePayload = {
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      message: 'Plan written successfully',
    };

    logger.debug({ sessionId, jdId }, '[WritePlanAction] < handle');
    return agentResponse.ok(bedrockEvent, responsePayload);
  } catch (error) {
    logger.error({ error }, '[WritePlanAction] - Unhandled error');
    return agentResponse.error(
      event as BedrockActionEvent,
      'Internal Server Error',
      'An unexpected error occurred while writing the plan',
    );
  }
};

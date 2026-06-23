import { BedrockActionEvent, BedrockActionResponse, AssessmentSchema, type Assessment } from '@interview-forge/shared';
import { ZodError } from 'zod';

import { logger } from '@/utils/logger';
import { WriteAssessmentActionEvent, writeAssessmentActionEventSchema } from '@/schemas/write-assessment-schema';
import { agentResponse } from '@/utils/agent-response';
import { extractRequiredParameter } from '@/utils/agent-request';
import { sessionService } from '@/services/session-service';

/**
 * Write Assessment Action - Bedrock Agents action group Lambda handler
 *
 * Invoked by Bedrock Agents to write an assessment to a session.
 * Validates the assessment against AssessmentSchema and updates the session with the assessment.
 *
 * Event contract: { actionGroup, function, parameters }
 * Response contract: { actionGroup, function, functionResponse: { responseBody: { TEXT: { body: JSON string } } } }
 *
 * Parameters:
 * - sessionId: The ID of the session to update
 * - jdId: The ID of the parent job description
 * - assessment: Serialized JSON string of the assessment
 *
 * Responsibilities:
 * - Validate Bedrock action group event structure using schema
 * - Extract and validate required parameters using schemas
 * - Parse assessment JSON string
 * - Validate assessment against AssessmentSchema
 * - Update session with assessment and status=ASSESSED
 * - Return structured Bedrock response with success or validation error
 */
export const handle = async (event: unknown): Promise<BedrockActionResponse> => {
  logger.info('[WriteAssessmentAction] > handle');
  logger.debug({ event }, '[WriteAssessmentAction] - Received event');

  try {
    // Validate Bedrock event structure against schema
    logger.debug('[WriteAssessmentAction] - Validating Bedrock action event');
    const eventValidation = writeAssessmentActionEventSchema.safeParse(event);

    if (!eventValidation.success) {
      // Request invalid - return error response with details
      logger.warn('[WriteAssessmentAction] - Invalid Bedrock event structure');
      return agentResponse.error(
        event as BedrockActionEvent,
        'Invalid event structure',
        'Event must have actionGroup, function, and parameters',
      );
    }

    // Request valid - extract parameters
    const bedrockEvent: WriteAssessmentActionEvent = eventValidation.data;
    logger.debug('[WriteAssessmentAction] - Event structure validated');

    // Extract parameters
    logger.debug('[WriteAssessmentAction] - Extracting parameters');
    const jdId = extractRequiredParameter(bedrockEvent.parameters, 'jdId');
    const sessionId = extractRequiredParameter(bedrockEvent.parameters, 'sessionId');
    const assessmentJsonString = extractRequiredParameter(bedrockEvent.parameters, 'assessment');

    logger.debug({ sessionId, jdId }, '[WriteAssessmentAction] - Parameters validated');

    // Parse and validate assessment JSON string
    logger.debug('[WriteAssessmentAction] - Parsing assessment JSON string and validating against schema');
    let assessment: Assessment;
    try {
      const parsedAssessment = JSON.parse(assessmentJsonString!);
      logger.debug('[WriteAssessmentAction] - Assessment JSON parsed successfully');

      // Validate assessment against AssessmentSchema
      assessment = AssessmentSchema.parse(parsedAssessment);
      logger.debug('[WriteAssessmentAction] - Validated assessment against schema');
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        logger.warn(
          { errorMessage: validationMessage },
          '[WriteAssessmentAction] < handle - Assessment JSON failed schema validation',
        );
        return agentResponse.error(
          bedrockEvent,
          'Invalid assessment format',
          `Assessment JSON validation failed: ${validationMessage}`,
        );
      }
      logger.warn({ error }, '[WriteAssessmentAction] < handle - Failed to parse assessment JSON string');
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
      return agentResponse.error(
        bedrockEvent,
        'Invalid assessment format',
        `assessment parameter must be a valid JSON string: ${errorMessage}`,
      );
    }

    // Assessment is valid - Update session with assessment and status
    logger.debug({ sessionId, jdId }, '[WriteAssessmentAction] - Updating session with assessment');
    const updatedSession = await sessionService.updateSession(jdId, sessionId, {
      assessment,
      status: 'ASSESSED',
    });

    logger.info({ sessionId, jdId }, '[WriteAssessmentAction] - Session updated successfully');

    // Build response payload
    const responsePayload = {
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      message: 'Assessment written successfully',
    };

    logger.debug({ sessionId, jdId }, '[WriteAssessmentAction] < handle');
    return agentResponse.ok(bedrockEvent, responsePayload);
  } catch (error) {
    logger.error({ error }, '[WriteAssessmentAction] - Unhandled error');
    return agentResponse.error(
      event as BedrockActionEvent,
      'Internal Server Error',
      'An unexpected error occurred while writing the assessment',
    );
  }
};

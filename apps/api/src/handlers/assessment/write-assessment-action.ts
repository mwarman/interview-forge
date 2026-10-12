import { AssessmentSchema, type Assessment } from '@interview-forge/shared';
import { ZodError } from 'zod';

import { logger } from '@/utils/logger';
import { toolArgsError, toolError, type ToolErrorResult } from '@/utils/tool-result';
import { writeAssessmentArgsSchema } from '@/schemas/write-assessment-schema';
import { sessionService } from '@/services/session-service';

/**
 * Successful result of the write-assessment tool
 */
interface WriteAssessmentResult {
  sessionId: string;
  status: string;
  message: string;
}

/**
 * WriteAssessment Action - AgentCore gateway tool Lambda handler
 *
 * Invoked by an AgentCore gateway to write an assessment to a session.
 * Validates the assessment against AssessmentSchema and updates the session with the assessment and status=ASSESSED.
 *
 * Event contract: flat tool arguments { sessionId, jdId, assessment } where assessment is a serialized JSON string
 * Response contract: JSON result, or { error, message } when the tool fails
 *
 * Responsibilities:
 * - Validate the tool arguments using schema
 * - Parse assessment JSON string
 * - Validate assessment against AssessmentSchema
 * - Update session with assessment and status=ASSESSED
 * - Return success result or validation error result
 */
export const handle = async (event: unknown): Promise<WriteAssessmentResult | ToolErrorResult> => {
  logger.info('[WriteAssessmentAction] > handle');
  logger.debug({ event }, '[WriteAssessmentAction] - Received event');

  try {
    const validation = writeAssessmentArgsSchema.safeParse(event);

    if (!validation.success) {
      logger.warn('[WriteAssessmentAction] - Invalid tool arguments');
      return toolArgsError(validation.error);
    }

    const { jdId, sessionId, assessment: assessmentJsonString } = validation.data;

    logger.debug('[WriteAssessmentAction] - Parsing assessment JSON string and validating against schema');
    let assessment: Assessment;
    try {
      assessment = AssessmentSchema.parse(JSON.parse(assessmentJsonString));
    } catch (error) {
      if (error instanceof ZodError) {
        const validationMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        logger.warn(
          { errorMessage: validationMessage },
          '[WriteAssessmentAction] - Assessment JSON failed schema validation',
        );
        return toolError('Invalid assessment format', `Assessment JSON validation failed: ${validationMessage}`);
      }
      logger.warn({ error }, '[WriteAssessmentAction] - Failed to parse assessment JSON string');
      const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
      return toolError(
        'Invalid assessment format',
        `assessment parameter must be a valid JSON string: ${errorMessage}`,
      );
    }

    logger.debug({ sessionId, jdId }, '[WriteAssessmentAction] - Updating session with assessment');
    const updatedSession = await sessionService.updateSession(jdId, sessionId, {
      assessment,
      status: 'ASSESSED',
    });

    logger.info({ sessionId, jdId }, '[WriteAssessmentAction] < handle - Session updated successfully');
    return {
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      message: 'Assessment written successfully',
    };
  } catch (error) {
    logger.error({ error }, '[WriteAssessmentAction] - Unhandled error');
    return toolError('Internal Server Error', 'An unexpected error occurred while writing the assessment');
  }
};

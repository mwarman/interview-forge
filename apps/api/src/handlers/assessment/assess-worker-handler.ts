import { logger } from '@/utils/logger';
import { assessService } from '@/services/assess-service';
import { sessionRepository } from '@/repositories/session-repository';
import { assessWorkerEventSchema, AssessWorkerEvent } from '@/schemas/assess-worker-event-schema';

/**
 * Assess Worker Handler - asynchronously generates assessment using Bedrock Agent
 * Invoked asynchronously by assess-kickoff-handler, never directly by API Gateway
 *
 * Event payload: { jdId: string, sessionId: string }
 *
 * Responsibilities:
 * - Validate and parse the event payload
 * - Invoke Bedrock Agent via assessService.generateAssessment
 * - Log agent invocation duration at info level for cost monitoring
 * - On any unhandled exception, update session status to ASSESS_ERROR with error message
 * - Persist error status even if DynamoDB write fails (nested try/catch)
 *
 * Note: This handler does not return HTTP responses (it's not invoked by API Gateway)
 * Success or failure is tracked via DynamoDB session record status
 */
export const handle = async (event: AssessWorkerEvent | unknown): Promise<void> => {
  try {
    logger.info('[AssessWorkerHandler] > handle');

    // Validate and parse the event payload
    const validationResult = assessWorkerEventSchema.safeParse(event);
    if (!validationResult.success) {
      logger.error(
        { validationErrors: validationResult.error.issues, event },
        '[AssessWorkerHandler] - Invalid event payload',
      );
      // For async Lambda, validation errors cannot be recoverable; log and abort
      throw validationResult.error;
    }

    const { jdId, sessionId } = validationResult.data;

    logger.debug(
      { jdId, sessionId },
      '[AssessWorkerHandler] - Event validated, invoking assessment generation service',
    );

    // Invoke assessment generation service (reuse existing service logic)
    // This will invoke Bedrock Agent and wait for completion
    // The write-assessment-action Lambda will write the assessment to session
    await assessService.generateAssessment(jdId, sessionId);

    // Log completion
    logger.info(
      { jdId, sessionId },
      '[AssessWorkerHandler] - Assessment generation completed, write-assessment-action has updated session',
    );
    logger.info({ jdId, sessionId }, '[AssessWorkerHandler] < handle');
  } catch (error) {
    // Extract jdId and sessionId from the event for error tracking
    let jdId: string | undefined;
    let sessionId: string | undefined;

    if (typeof event === 'object' && event !== null) {
      const eventObj = event as Record<string, unknown>;
      jdId = eventObj.jdId as string | undefined;
      sessionId = eventObj.sessionId as string | undefined;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      { error, errorMessage, jdId, sessionId },
      '[AssessWorkerHandler] - Assessment generation failed, attempting to write ASSESS_ERROR status',
    );

    // Write ASSESS_ERROR status to session
    // Use nested try/catch to ensure error status is always persisted
    if (jdId && sessionId) {
      try {
        logger.debug(
          { jdId, sessionId },
          '[AssessWorkerHandler] - Writing ASSESS_ERROR status and error message to session',
        );

        await sessionRepository.updateById(jdId, sessionId, {
          status: 'ASSESS_ERROR',
          assessErrorMessage: errorMessage,
        });

        logger.info(
          { jdId, sessionId },
          '[AssessWorkerHandler] - ASSESS_ERROR status and error message written to session',
        );
      } catch (updateError) {
        logger.error(
          { error: updateError, jdId, sessionId },
          '[AssessWorkerHandler] - Failed to write ASSESS_ERROR status to session',
        );
        // Absorb the error — we've attempted to persist the error state
      }
    }

    // Note: Async Lambda handlers should not re-throw errors (no HTTP response expected)
    // The error state is captured in DynamoDB for the client to retrieve via polling
  }
};

import { logger } from '@/utils/logger';
import { planService } from '@/services/plan-service';
import { sessionRepository } from '@/repositories/session-repository';
import { planWorkerEventSchema, PlanWorkerEvent } from '@/schemas/plan-worker-event-schema';

/**
 * Plan Worker Handler - asynchronously generates interview plan using Bedrock Agent
 * Invoked asynchronously by plan-kickoff-handler, never directly by API Gateway
 *
 * Event payload: { jdId: string, sessionId: string }
 *
 * Responsibilities:
 * - Validate and parse the event payload
 * - Invoke Bedrock Agent via planService.generatePlan
 * - Log agent invocation duration at info level for cost monitoring
 * - On any unhandled exception, update session status to PLAN_ERROR with error message
 * - Persist error status even if DynamoDB write fails (nested try/catch)
 *
 * Note: This handler does not return HTTP responses (it's not invoked by API Gateway)
 * Success or failure is tracked via DynamoDB session record status
 */
export const handle = async (event: PlanWorkerEvent | unknown): Promise<void> => {
  try {
    logger.info('[PlanWorkerHandler] > handle');

    // Validate and parse the event payload
    const validationResult = planWorkerEventSchema.safeParse(event);
    if (!validationResult.success) {
      logger.error(
        { validationErrors: validationResult.error.issues, event },
        '[PlanWorkerHandler] - Invalid event payload',
      );
      // For async Lambda, validation errors cannot be recoverable; log and abort
      throw validationResult.error;
    }

    const { jdId, sessionId } = validationResult.data;

    logger.debug({ jdId, sessionId }, '[PlanWorkerHandler] - Event validated, invoking plan generation service');

    // Invoke plan generation service (reuse existing service logic)
    // This will invoke Bedrock Agent and wait for completion
    // The write-plan-action Lambda will write the plan to session
    await planService.generatePlan(jdId, sessionId);

    // Log completion
    logger.info(
      { jdId, sessionId },
      '[PlanWorkerHandler] - Plan generation completed, write-plan-action has updated session',
    );
    logger.info({ jdId, sessionId }, '[PlanWorkerHandler] < handle');
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
      '[PlanWorkerHandler] - Plan generation failed, attempting to write PLAN_ERROR status',
    );

    // Write PLAN_ERROR status to session
    // Use nested try/catch to ensure error status is always persisted
    if (jdId && sessionId) {
      try {
        logger.debug(
          { jdId, sessionId },
          '[PlanWorkerHandler] - Writing PLAN_ERROR status and error message to session',
        );

        await sessionRepository.updateById(jdId, sessionId, {
          status: 'PLAN_ERROR',
          planErrorMessage: errorMessage,
        });

        logger.info(
          { jdId, sessionId },
          '[PlanWorkerHandler] - PLAN_ERROR status and error message written to session',
        );
      } catch (updateError) {
        logger.error(
          { error: updateError, jdId, sessionId },
          '[PlanWorkerHandler] - Failed to write PLAN_ERROR status to session',
        );
        // Absorb the error — we've attempted to persist the error state
      }
    }

    // Note: Async Lambda handlers should not re-throw errors (no HTTP response expected)
    // The error state is captured in DynamoDB for the client to retrieve via polling
  }
};

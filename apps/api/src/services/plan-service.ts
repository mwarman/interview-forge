import { Session } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { config } from '@/utils/config';
import { sessionRepository } from '@/repositories/session-repository';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';
import { invokeLambdaAsync } from '@/utils/lambda-client';
import { invokeHarness } from '@/utils/harness-client';
import { NotFoundError, ConflictError } from '@/errors/api-error';

/**
 * Service for Interview Plan business logic
 * Encapsulates AgentCore harness orchestration and plan generation
 */
export class PlanService {
  /**
   * Generate an interview plan by invoking the AgentCore plan harness
   * Invokes the agent with jdId and sessionId as the initial user message
   * Drains the harness response stream until completion
   * Reads the updated session from DynamoDB to retrieve the written plan
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The updated session with the generated plan
   * @throws PlanNotWrittenError if agent completes without writing plan
   * @throws AgentInvocationError if agent invocation fails
   */
  async generatePlan(jdId: string, sessionId: string): Promise<Session> {
    logger.info({ jdId, sessionId }, '[PlanService.generatePlan] > generatePlan');

    const startTime = Date.now();

    try {
      // Construct the user message for the agent
      const userMessage = `Generate an interview plan for job description ${jdId} and session ${sessionId}`;

      logger.debug({ jdId, sessionId, userMessage }, '[PlanService.generatePlan] - Invoking AgentCore harness');

      // Invoke the harness and drain its stream; the stream's exhaustion marks the end of the agent's work
      const agentResponse = await invokeHarness({
        harnessArn: config.PLAN_HARNESS_ARN,
        sessionId, // Pass sessionId as the runtime session ID for continuity
        prompt: userMessage,
      });

      logger.debug({ agentResponse }, '[PlanService.generatePlan] - Agent stream completed');

      const durationMs = Date.now() - startTime;
      logger.info({ jdId, sessionId, durationMs }, '[PlanService.generatePlan] - Agent invocation completed');

      // Read the updated session from DynamoDB
      logger.debug({ jdId, sessionId }, '[PlanService.generatePlan] - Reading updated session from DynamoDB');
      const updatedSession = await sessionRepository.getById(jdId, sessionId);

      if (!updatedSession) {
        logger.error({ jdId, sessionId }, '[PlanService.generatePlan] - Session not found after agent invocation');
        throw new AgentInvocationError(
          jdId,
          sessionId,
          new Error('Session not found after agent invocation'),
          'Failed to retrieve session after plan generation',
        );
      }

      // Validate that plan was written
      if (!updatedSession.plan) {
        logger.warn(
          { jdId, sessionId },
          '[PlanService.generatePlan] - Agent completed but plan was not written to session',
        );
        throw new PlanNotWrittenError(jdId, sessionId);
      }

      logger.info({ jdId, sessionId }, '[PlanService.generatePlan] < generatePlan');
      return updatedSession;
    } catch (error) {
      if (error instanceof PlanNotWrittenError || error instanceof AgentInvocationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error, errorMessage, jdId, sessionId }, '[PlanService.generatePlan] - Failed to generate plan');
      throw new AgentInvocationError(jdId, sessionId, error as Error);
    }
  }

  /**
   * Kickoff plan generation for a session
   * Validates the session exists and is in a valid pre-generation state (PLAN_GENERATING or PLAN_ERROR)
   * Updates the session status to PLAN_GENERATING
   * On success, returns the updated session
   * On error, updates session status to PLAN_ERROR with error message and rethrows
   *
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The updated session with status PLAN_GENERATING
   * @throws Error if session not found (404), invalid status (409), or DynamoDB write fails
   */
  async kickoffPlanGeneration(jdId: string, sessionId: string): Promise<Session> {
    logger.info({ jdId, sessionId }, '[PlanService.kickoffPlanGeneration] > kickoffPlanGeneration');

    try {
      // Fetch the session from DynamoDB
      logger.debug({ jdId, sessionId }, '[PlanService.kickoffPlanGeneration] - Reading session from DynamoDB');
      const session = await sessionRepository.getById(jdId, sessionId);

      if (!session) {
        logger.warn({ jdId, sessionId }, '[PlanService.kickoffPlanGeneration] - Session not found');
        throw new NotFoundError('Session not found');
      }

      // Validate session status is in valid pre-generation states
      const validPreGenerationStatuses = ['PLAN_PENDING', 'PLAN_ERROR'];
      if (!validPreGenerationStatuses.includes(session.status)) {
        logger.warn(
          { jdId, sessionId, currentStatus: session.status },
          '[PlanService.kickoffPlanGeneration] - Session status invalid for plan generation kickoff',
        );
        throw new ConflictError(
          `Session status ${session.status} is not valid for plan generation. Expected one of: ${validPreGenerationStatuses.join(', ')}`,
        );
      }

      // Update session status to PLAN_GENERATING
      logger.debug(
        { jdId, sessionId },
        '[PlanService.kickoffPlanGeneration] - Updating session status to PLAN_GENERATING',
      );
      const updatedSession = await sessionRepository.updateById(jdId, sessionId, { status: 'PLAN_GENERATING' });

      // Invoke the plan-worker Lambda asynchronously (fire and forget)
      // The worker will handle AgentCore harness invocation and error handling
      logger.debug(
        { jdId, sessionId },
        '[PlanService.kickoffPlanGeneration] - Invoking plan-worker Lambda asynchronously',
      );
      await invokeLambdaAsync(config.PLAN_WORKER_FUNCTION_NAME, { jdId, sessionId });

      logger.info({ jdId, sessionId }, '[PlanService.kickoffPlanGeneration] < kickoffPlanGeneration');
      return updatedSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { error, errorMessage, jdId, sessionId },
        '[PlanService.kickoffPlanGeneration] - Failed to kickoff plan generation',
      );

      // Attempt to write PLAN_ERROR status to session
      // Use nested try/catch to ensure error status is always attempted to be persisted
      try {
        logger.debug(
          { jdId, sessionId },
          '[PlanService.kickoffPlanGeneration] - Attempting to write PLAN_ERROR status to session',
        );
        await sessionRepository.updateById(jdId, sessionId, {
          status: 'PLAN_ERROR',
          planErrorMessage: errorMessage,
        });
        logger.debug({ jdId, sessionId }, '[PlanService.kickoffPlanGeneration] - PLAN_ERROR status written');
      } catch (updateError) {
        logger.error(
          { error: updateError, jdId, sessionId },
          '[PlanService.kickoffPlanGeneration] - Failed to write PLAN_ERROR status to session',
        );
        // Absorb the error — the original error will be thrown below
      }

      throw error;
    }
  }
}

/**
 * Singleton instance of PlanService
 */
export const planService = new PlanService();

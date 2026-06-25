import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';

import { Session } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { config } from '@/utils/config';
import { sessionRepository } from '@/repositories/session-repository';
import { AssessmentNotWrittenError } from '@/errors/assessment-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';
import { invokeLambdaAsync } from '@/utils/lambda-client';
import { NotFoundError, ConflictError } from '@/errors/api-error';

/**
 * Service for Assessment business logic
 * Encapsulates Bedrock Agent orchestration and assessment generation
 */
export class AssessService {
  private bedrockClient: BedrockAgentRuntimeClient;

  constructor() {
    this.bedrockClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  /**
   * Generate an assessment by invoking the Bedrock Assessment Agent
   * Invokes the agent with jdId and sessionId as the initial user message
   * Streams the agent response until completion event
   * Reads the updated session from DynamoDB to retrieve the written assessment
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The updated session with the generated assessment
   * @throws AssessmentNotWrittenError if agent completes without writing assessment
   * @throws AgentInvocationError if agent invocation fails
   */
  async generateAssessment(jdId: string, sessionId: string): Promise<Session> {
    logger.info({ jdId, sessionId }, '[AssessService.generateAssessment] > generateAssessment');

    const startTime = Date.now();

    try {
      // Construct the user message for the agent
      const userMessage = `Generate an assessment for job description ${jdId} and session ${sessionId}`;

      logger.debug({ jdId, sessionId, userMessage }, '[AssessService.generateAssessment] - Preparing agent invocation');

      // Prepare the InvokeAgentCommand
      const input: InvokeAgentCommandInput = {
        agentId: config.ASSESS_AGENT_ID,
        agentAliasId: config.ASSESS_AGENT_ALIAS_ID,
        sessionId: sessionId, // Pass sessionId as Bedrock session ID for continuity
        inputText: userMessage,
        enableTrace: true, // Enable tracing for better observability in CloudWatch
      };

      logger.debug('[AssessService.generateAssessment] - Invoking Bedrock Agent');

      // Invoke the agent and get the streaming response
      const response = await this.bedrockClient.send(new InvokeAgentCommand(input));

      logger.debug({ response }, '[AssessService.generateAssessment] - Streaming agent response');

      // Iterate through the response stream to ensure the agent completes
      // The stream's completion (when it exhausts) marks the end of the agent's work
      if (!response.completion) {
        throw new AgentInvocationError(
          jdId,
          sessionId,
          new Error('No completion stream returned from agent'),
          'Agent did not return a completion stream',
        );
      }

      let agentResponse = '';
      for await (const event of response.completion) {
        logger.debug('[AssessService.generateAssessment] - Received agent event');
        if (event.chunk) {
          // Decode the binary bytes of the response (optional, for logging purposes)
          const decodedChunk = new TextDecoder('utf-8').decode(event.chunk.bytes);
          agentResponse += decodedChunk;
        }
      }

      logger.debug({ agentResponse }, '[AssessService.generateAssessment] - Agent stream completed');

      const durationMs = Date.now() - startTime;
      logger.info({ jdId, sessionId, durationMs }, '[AssessService.generateAssessment] - Agent invocation completed');

      // Read the updated session from DynamoDB
      logger.debug({ jdId, sessionId }, '[AssessService.generateAssessment] - Reading updated session from DynamoDB');
      const updatedSession = await sessionRepository.getById(jdId, sessionId);

      if (!updatedSession) {
        logger.error(
          { jdId, sessionId },
          '[AssessService.generateAssessment] - Session not found after agent invocation',
        );
        throw new AgentInvocationError(
          jdId,
          sessionId,
          new Error('Session not found after agent invocation'),
          'Failed to retrieve session after assessment generation',
        );
      }

      // Validate that assessment was written
      if (!updatedSession.assessment) {
        logger.warn(
          { jdId, sessionId },
          '[AssessService.generateAssessment] - Agent completed but assessment was not written to session',
        );
        throw new AssessmentNotWrittenError(jdId, sessionId);
      }

      logger.info({ jdId, sessionId }, '[AssessService.generateAssessment] < generateAssessment');
      return updatedSession;
    } catch (error) {
      if (error instanceof AssessmentNotWrittenError || error instanceof AgentInvocationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { error, errorMessage, jdId, sessionId },
        '[AssessService.generateAssessment] - Failed to generate assessment',
      );
      throw new AgentInvocationError(jdId, sessionId, error as Error);
    }
  }

  /**
   * Kickoff assessment generation for a session
   * Validates the session exists and is in a valid pre-generation state (SCORED or ASSESS_ERROR)
   * Updates the session status to ASSESS_GENERATING
   * On success, returns the updated session
   * On error, updates session status to ASSESS_ERROR with error message and rethrows
   *
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The updated session with status ASSESS_GENERATING
   * @throws Error if session not found (404), invalid status (409), or DynamoDB write fails
   */
  async kickoffAssessmentGeneration(jdId: string, sessionId: string): Promise<Session> {
    logger.info({ jdId, sessionId }, '[AssessService.kickoffAssessmentGeneration] > kickoffAssessmentGeneration');

    try {
      // Fetch the session from DynamoDB
      logger.debug({ jdId, sessionId }, '[AssessService.kickoffAssessmentGeneration] - Reading session from DynamoDB');
      const session = await sessionRepository.getById(jdId, sessionId);

      if (!session) {
        logger.warn({ jdId, sessionId }, '[AssessService.kickoffAssessmentGeneration] - Session not found');
        throw new NotFoundError('Session not found');
      }

      // Validate session status is in valid pre-generation states
      const validPreGenerationStatuses = ['SCORED', 'ASSESS_ERROR'];
      if (!validPreGenerationStatuses.includes(session.status)) {
        logger.warn(
          { jdId, sessionId, currentStatus: session.status },
          '[AssessService.kickoffAssessmentGeneration] - Session status invalid for assessment generation kickoff',
        );
        throw new ConflictError(
          `Session status ${session.status} is not valid for assessment generation. Expected one of: ${validPreGenerationStatuses.join(', ')}`,
        );
      }

      // Update session status to ASSESS_GENERATING
      logger.debug(
        { jdId, sessionId },
        '[AssessService.kickoffAssessmentGeneration] - Updating session status to ASSESS_GENERATING',
      );
      const updatedSession = await sessionRepository.updateById(jdId, sessionId, { status: 'ASSESS_GENERATING' });

      // Invoke the assess-worker Lambda asynchronously (fire and forget)
      // The worker will handle Bedrock Agent invocation and error handling
      logger.debug(
        { jdId, sessionId },
        '[AssessService.kickoffAssessmentGeneration] - Invoking assess-worker Lambda asynchronously',
      );
      await invokeLambdaAsync(config.ASSESS_WORKER_FUNCTION_NAME, { jdId, sessionId });

      logger.info({ jdId, sessionId }, '[AssessService.kickoffAssessmentGeneration] < kickoffAssessmentGeneration');
      return updatedSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { error, errorMessage, jdId, sessionId },
        '[AssessService.kickoffAssessmentGeneration] - Failed to kickoff assessment generation',
      );

      // Attempt to write ASSESS_ERROR status to session
      // Use nested try/catch to ensure error status is always attempted to be persisted
      try {
        logger.debug(
          { jdId, sessionId },
          '[AssessService.kickoffAssessmentGeneration] - Attempting to write ASSESS_ERROR status to session',
        );
        await sessionRepository.updateById(jdId, sessionId, {
          status: 'ASSESS_ERROR',
          assessErrorMessage: errorMessage,
        });
        logger.debug({ jdId, sessionId }, '[AssessService.kickoffAssessmentGeneration] - ASSESS_ERROR status written');
      } catch (updateError) {
        logger.error(
          { error: updateError, jdId, sessionId },
          '[AssessService.kickoffAssessmentGeneration] - Failed to write ASSESS_ERROR status to session',
        );
        // Absorb the error — the original error will be thrown below
      }

      throw error;
    }
  }
}

/**
 * Singleton instance of AssessService
 */
export const assessService = new AssessService();

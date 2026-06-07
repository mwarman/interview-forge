import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';

import { Session } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { config } from '@/utils/config';
import { sessionRepository } from '@/repositories/session-repository';
import { PlanNotWrittenError } from '@/errors/plan-not-written-error';
import { AgentInvocationError } from '@/errors/agent-invocation-error';

/**
 * Service for Interview Plan business logic
 * Encapsulates Bedrock Agent orchestration and plan generation
 */
export class PlanService {
  private bedrockClient: BedrockAgentRuntimeClient;

  constructor() {
    this.bedrockClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  /**
   * Generate an interview plan by invoking the Bedrock Plan Agent
   * Invokes the agent with jdId and sessionId as the initial user message
   * Streams the agent response until completion event
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

      logger.debug({ jdId, sessionId, userMessage }, '[PlanService.generatePlan] - Preparing agent invocation');

      // Prepare the InvokeAgentCommand
      const input: InvokeAgentCommandInput = {
        agentId: config.PLAN_AGENT_ALIAS_ID,
        agentAliasId: config.PLAN_AGENT_ALIAS_ID,
        sessionId: sessionId, // Pass sessionId as Bedrock session ID for continuity
        inputText: userMessage,
      };

      logger.debug('[PlanService.generatePlan] - Invoking Bedrock Agent');

      // Invoke the agent and get the streaming response
      const response = await this.bedrockClient.send(new InvokeAgentCommand(input));

      logger.debug('[PlanService.generatePlan] - Streaming agent response');

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

      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          // Decode the binary bytes of the response (optional, for logging purposes)
          const chunkText = new TextDecoder('utf-8').decode(event.chunk.bytes);
          logger.debug({ bytes: chunkText.length }, '[PlanService.generatePlan] - Received chunk');
        }
      }

      logger.debug('[PlanService.generatePlan] - Agent stream completed');

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

      logger.error({ error, jdId, sessionId }, '[PlanService.generatePlan] - Failed to generate plan');
      throw new AgentInvocationError(jdId, sessionId, error as Error);
    }
  }
}

/**
 * Singleton instance of PlanService
 */
export const planService = new PlanService();

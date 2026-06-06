import { BedrockActionEvent, BedrockActionResponse } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { extractParameter } from '@/utils/agent-request';
import { agentResponse } from '@/utils/agent-response';
import { readJdActionEventSchema, type ReadJdActionEvent } from '@/schemas/read-jd-schema';
import { jobDescriptionService } from '@/services/job-description-service';

/**
 * Read JD Action - Bedrock Agents action group Lambda handler
 *
 * Invoked by Bedrock Agents to read a job description from DynamoDB.
 * Returns the job description title and raw text in Bedrock action group response format.
 *
 * Event contract: { actionGroup, function, parameters }
 * Response contract: { actionGroup, function, functionResponse: { responseBody: { TEXT: { body: JSON string } } } }
 *
 * Parameters:
 * - jdId: The ID of the job description to retrieve
 *
 * Responsibilities:
 * - Validate Bedrock action group event structure using schema
 * - Extract and validate jdId parameter using schema
 * - Retrieve job description using service layer
 * - Return structured Bedrock response with title and rawText
 * - Return error response if JD not found or validation fails
 */
export const handle = async (event: unknown): Promise<BedrockActionResponse> => {
  logger.info('[ReadJdAction] > handle');
  logger.debug({ event }, '[ReadJdAction] - Received event');

  try {
    // Validate Bedrock event structure against schema
    logger.debug('[ReadJdAction] - Validating Bedrock action event');
    const eventValidation = readJdActionEventSchema.safeParse(event);

    if (!eventValidation.success) {
      // Request invalid - return error response with details
      logger.warn('[ReadJdAction] - Invalid Bedrock event structure');
      return agentResponse.error(
        event as BedrockActionEvent,
        'Invalid event structure',
        'Event must have actionGroup, function, and parameters',
      );
    }

    // Request valid - extract parameters
    const bedrockEvent: ReadJdActionEvent = eventValidation.data;
    logger.debug('[ReadJdAction] - Event structure validated');

    // Extract jdId from parameters
    logger.debug('[ReadJdAction] - Extracting jdId parameter');
    const jdId = extractParameter(bedrockEvent.parameters, 'jdId');

    // Fetch job description from service
    logger.debug({ jdId }, '[ReadJdAction] - Fetching job description');
    const jobDescription = await jobDescriptionService.getById(jdId!);

    if (!jobDescription) {
      logger.info({ jdId }, '[ReadJdAction] - Job description not found');
      return agentResponse.error(bedrockEvent, 'Not Found', `Job description with ID ${jdId} not found`);
    }

    logger.info({ jdId }, '[ReadJdAction] - Job description retrieved successfully');

    // Build response payload
    const responsePayload = {
      title: jobDescription.title,
      rawText: jobDescription.rawText,
    };

    logger.debug({ jdId }, '[ReadJdAction] < handle');
    return agentResponse.ok(bedrockEvent, responsePayload);
  } catch (error) {
    // Handle unexpected errors gracefully
    logger.error({ error }, '[ReadJdAction] - Unhandled error');
    return agentResponse.error(
      event as BedrockActionEvent,
      'Internal Server Error',
      'An unexpected error occurred while reading the job description',
    );
  }
};

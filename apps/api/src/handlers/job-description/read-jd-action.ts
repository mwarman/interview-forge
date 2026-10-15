import { logger } from '@/utils/logger';
import { toolArgsError, toolError, type ToolErrorResult } from '@/utils/tool-result';
import { readJdArgsSchema } from '@/schemas/read-jd-schema';
import { jobDescriptionService } from '@/services/job-description-service';

/**
 * Successful result of the read-jd tool
 */
interface ReadJdResult {
  title: string;
  rawText: string;
}

/**
 * Read JD Action - AgentCore gateway tool Lambda handler
 *
 * Invoked by an AgentCore gateway to read a job description from DynamoDB.
 * Returns the job description title and raw text.
 *
 * Event contract: flat tool arguments { jdId }
 * Response contract: JSON result, or { error, message } when the tool fails
 *
 * Responsibilities:
 * - Validate the tool arguments using schema
 * - Retrieve job description using service layer
 * - Return error result if JD not found or validation fails
 */
export const handle = async (event: unknown): Promise<ReadJdResult | ToolErrorResult> => {
  logger.info('[ReadJdAction] > handle');
  logger.debug({ event }, '[ReadJdAction] - Received event');

  try {
    const validation = readJdArgsSchema.safeParse(event);

    if (!validation.success) {
      logger.warn('[ReadJdAction] - Invalid tool arguments');
      return toolArgsError(validation.error);
    }

    const { jdId } = validation.data;

    logger.debug({ jdId }, '[ReadJdAction] - Fetching job description');
    const jobDescription = await jobDescriptionService.getById(jdId);

    if (!jobDescription) {
      logger.info({ jdId }, '[ReadJdAction] - Job description not found');
      return toolError('Not Found', `Job description with ID ${jdId} not found`);
    }

    logger.info({ jdId }, '[ReadJdAction] < handle - Job description retrieved successfully');
    return { title: jobDescription.title, rawText: jobDescription.rawText };
  } catch (error) {
    logger.error({ error }, '[ReadJdAction] - Unhandled error');
    return toolError('Internal Server Error', 'An unexpected error occurred while reading the job description');
  }
};

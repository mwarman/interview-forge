import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { jobDescriptionService } from '@/services/job-description-service';

/**
 * Get Job Description Handler - returns a single job description by ID
 *
 * Responsibilities:
 * - Extract jdId from path parameters
 * - Validate that jdId is provided
 * - Retrieve job description from service
 * - Return 200 on success, 404 if not found, 400 if invalid parameters
 * - Handle service errors appropriately
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[GetJdHandler] > handle');

    // Extract jdId from path parameters
    const jdId = event.pathParameters?.jdId;

    if (!jdId) {
      logger.warn('[GetJdHandler] - Missing jdId parameter');
      return response.badRequest('Invalid Request', 'jdId path parameter is required');
    }

    try {
      const jobDescription = await jobDescriptionService.getById(jdId);
      logger.info({ jdId }, '[GetJdHandler] < handle');
      return response.ok(jobDescription);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if this is a not found error
      if (errorMessage.includes('not found')) {
        logger.info({ jdId }, '[GetJdHandler] - Job description not found');
        return response.notFound('Not Found', `Job description with ID ${jdId} not found`);
      }

      // Re-throw for unhandled errors
      throw error;
    }
  } catch (error) {
    logger.error({ error }, '[GetJdHandler] - Unhandled error');
    return response.internalServerError(
      'Retrieval Error',
      'An unexpected error occurred while retrieving the job description',
    );
  }
};

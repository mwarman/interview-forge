import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { response } from '@/utils/response';
import { logger, withRequestTracking } from '@/utils/logger';
import { jobDescriptionService } from '@/services/job-description-service';

/**
 * List Job Description Handler - returns all job descriptions sorted by createdAt descending
 *
 * Responsibilities:
 * - Handle GET /jds requests
 * - Retrieve all job descriptions from service
 * - Format and return response to API Gateway
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[ListJdHandler] > handle');

    const jobDescriptions = await jobDescriptionService.listAll();

    logger.info({ count: jobDescriptions.length }, '[ListJdHandler] < handle');

    return response.ok(jobDescriptions);
  } catch (error) {
    logger.error({ error }, '[ListJdHandler] - Unhandled error');
    return response.internalServerError('List Error', 'An unexpected error occurred while retrieving job descriptions');
  }
};

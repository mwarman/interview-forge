import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { CreateJobDescriptionRequestSchema } from '@interview-forge/shared';
import { response } from '../../utils/response';
import { logger, withRequestTracking } from '../../utils/logger';
import { parseBody, ValidationError } from '../../utils/validate';
import { jobDescriptionService } from '../../services/job-description-service';

/**
 * Create Job Description Handler - accepts job descriptions via paste or file upload
 * Paste mode: { mode: 'paste', title, rawText }
 * Upload mode: { mode: 'upload', title, s3Key }
 *
 * Responsibilities:
 * - Parse and validate incoming request
 * - Route to appropriate business service
 * - Handle service errors and return appropriate responses
 * - Format and return response to API Gateway
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[CreateJdHandler] > handle');

    // Parse and validate request body
    let request;
    try {
      request = parseBody(CreateJobDescriptionRequestSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[CreateJdHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request body validation failed');
      }
      throw error;
    }

    let createdJobDescription;

    // Route to appropriate service method based on mode
    if (request.mode === 'paste') {
      logger.debug({ title: request.title }, '[CreateJdHandler] - Routing to paste mode');
      createdJobDescription = await jobDescriptionService.createFromPaste(request.title, request.rawText);
    } else {
      logger.debug({ title: request.title, s3Key: request.s3Key }, '[CreateJdHandler] - Routing to upload mode');
      createdJobDescription = await jobDescriptionService.createFromUpload(request.title, request.s3Key);
    }

    logger.info({ jdId: createdJobDescription.jdId }, '[CreateJdHandler] < handle');

    return response.created(createdJobDescription);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if this is a PDF extraction issue that should return 422
    if (errorMessage.includes('scanned') || errorMessage.includes('encrypted') || errorMessage.includes('parsed')) {
      logger.info({ error: errorMessage }, '[CreateJdHandler] - PDF extraction failed (user-recoverable)');
      return response.unprocessableEntity(
        'PDF Extraction Failed',
        'This PDF appears to be scanned or encrypted. Please use the paste mode and copy the text directly.',
      );
    }

    // Check if this is a file not found or other processing error
    if (errorMessage.includes('NoSuchKey') || errorMessage.includes('File must be')) {
      logger.warn({ error: errorMessage }, '[CreateJdHandler] - File processing error');
      return response.badRequest('File Processing Error', errorMessage);
    }

    // Unhandled errors
    logger.error({ error }, '[CreateJdHandler] - Unhandled error');
    return response.internalServerError(
      'Processing Error',
      'An unexpected error occurred while processing your request',
    );
  }
};

import { randomUUID } from 'crypto';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { CreatePresignedUrlRequestSchema, CreatePresignedUrlResponse } from '@interview-forge/shared';
import { response } from '../../utils/response';
import { logger, withRequestTracking } from '../../utils/logger';
import { parseBody, ValidationError } from '../../utils/validate';
import { s3Service } from '../../services/s3-service';
import { config } from '../../utils/config';

/**
 * Create Job Description Pre-signed URL Handler
 * Generates a pre-signed S3 PUT URL for uploading a job description file
 * Returns jdId, s3Key, and presignedUrl to the client
 *
 * Responsibilities:
 * - Parse and validate incoming request (filename)
 * - Generate unique jdId (UUID)
 * - Construct S3 key path (uploads/{jdId}/{filename})
 * - Request pre-signed URL from S3 service
 * - Return response with jdId, s3Key, and presignedUrl
 *
 * Request: { filename: string }
 * Response: { jdId: string, s3Key: string, presignedUrl: string }
 */
export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);

  try {
    logger.info('[CreateJdUrlHandler] > handle');

    // Parse and validate request body
    let request;
    try {
      request = parseBody(CreatePresignedUrlRequestSchema, event);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ issues: error.issues }, '[CreateJdUrlHandler] - Validation error');
        return response.badRequest('Validation Error', 'Request body validation failed');
      }
      throw error;
    }

    // Generate unique jdId
    const jdId = randomUUID();
    logger.debug({ jdId, filename: request.filename }, '[CreateJdUrlHandler] - Generated jdId');

    // Construct S3 key path
    const s3Key = `uploads/${jdId}/${request.filename}`;
    logger.debug({ s3Key }, '[CreateJdUrlHandler] - Constructed S3 key');

    // Request pre-signed URL from S3 service
    logger.debug({ bucket: config.JD_BUCKET_NAME, s3Key }, '[CreateJdUrlHandler] - Requesting pre-signed URL');
    const presignedUrl = await s3Service.getPresignedPutUrl(config.JD_BUCKET_NAME, s3Key);

    // Construct response
    const result: CreatePresignedUrlResponse = {
      jdId,
      s3Key,
      presignedUrl,
    };

    logger.info({ jdId, s3Key }, '[CreateJdUrlHandler] < handle');

    return response.created(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error({ error: errorMessage }, '[CreateJdUrlHandler] - Unhandled error');
    return response.internalServerError(
      'URL Generation Error',
      'An unexpected error occurred while generating the pre-signed URL',
    );
  }
};

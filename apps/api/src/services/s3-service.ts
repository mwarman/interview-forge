import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { s3Client } from '@/utils/s3-client';
import { logger } from '@/utils/logger';

/**
 * Service for S3 operations
 * Encapsulates S3 client interactions for pre-signed URLs and object operations
 */
export class S3Service {
  /**
   * Get an object from S3 and return it as a byte array
   * @param bucket - The S3 bucket name
   * @param s3Key - The S3 object key (path within bucket)
   * @returns The object content as a byte array
   * @throws Error if object retrieval fails
   */
  async getObject(bucket: string, s3Key: string): Promise<Uint8Array> {
    logger.info({ bucket, s3Key }, '[S3Service.getObject] > getObject');

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });

      logger.debug({ bucket, s3Key }, '[S3Service.getObject] - Fetching object from S3');
      const response = await s3Client.send(command);
      const buffer = await response.Body!.transformToByteArray();

      logger.debug({ bucket, s3Key, size: buffer.length }, '[S3Service.getObject] - Object retrieved from S3');
      logger.info({ bucket, s3Key }, '[S3Service.getObject] < getObject');
      return buffer;
    } catch (error) {
      logger.error({ error, bucket, s3Key }, '[S3Service.getObject] - Failed to retrieve object from S3');
      throw error;
    }
  }

  /**
   * Generate a pre-signed PUT URL for uploading a file to S3
   * @param bucket - The S3 bucket name
   * @param s3Key - The S3 object key (path within bucket)
   * @param expirationSeconds - How long the URL is valid (default: 300 seconds / 5 minutes)
   * @returns A pre-signed URL valid for the specified duration
   * @throws Error if URL generation fails
   */
  async getPresignedPutUrl(bucket: string, s3Key: string, expirationSeconds: number = 300): Promise<string> {
    logger.info({ bucket, s3Key, expirationSeconds }, '[S3Service.getPresignedPutUrl] > getPresignedPutUrl');

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });

      logger.debug({ bucket, s3Key }, '[S3Service.getPresignedPutUrl] - Generating pre-signed URL');

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expirationSeconds,
      });

      logger.debug({ bucket, s3Key }, '[S3Service.getPresignedPutUrl] - Pre-signed URL generated');

      logger.info('[S3Service.getPresignedPutUrl] < getPresignedPutUrl');
      return presignedUrl;
    } catch (error) {
      logger.error({ error, bucket, s3Key }, '[S3Service.getPresignedPutUrl] - Failed to generate pre-signed URL');
      throw error;
    }
  }
}

/**
 * Singleton S3Service instance for use throughout the application
 */
export const s3Service = new S3Service();

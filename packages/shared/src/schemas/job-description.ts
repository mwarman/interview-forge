import { z } from 'zod';

/**
 * JobDescriptionSchema - Zod schema for Job Description entity
 * Validates all JD attributes: title, rawText, optional s3Key, timestamps, and TTL
 */
export const JobDescriptionSchema = z.object({
  jdId: z.uuid('jdId must be a valid UUID'),
  title: z.string().min(1, 'title is required'),
  rawText: z.string().min(1, 'rawText is required'),
  s3Key: z.string().optional(),
  createdAt: z.iso.datetime('createdAt must be a valid ISO 8601 datetime'),
  TTL: z.number().int().positive('TTL must be a positive integer'),
});

/**
 * JobDescription - TypeScript type inferred from JobDescriptionSchema
 */
export type JobDescription = z.infer<typeof JobDescriptionSchema>;

/**
 * CreateJobDescriptionRequestSchema - Zod schema for JD ingest request
 * Discriminated union for paste mode (rawText) vs. upload mode (s3Key)
 * Upload mode accepts optional jdId provided from pre-signed URL generation
 */
export const CreateJobDescriptionRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('paste'),
    title: z.string().min(1, 'title is required'),
    rawText: z.string().min(1, 'rawText is required and must be non-empty'),
  }),
  z.object({
    mode: z.literal('upload'),
    title: z.string().min(1, 'title is required'),
    s3Key: z.string().min(1, 's3Key is required and must be non-empty'),
    jdId: z.string().uuid('jdId must be a valid UUID').optional(),
  }),
]);

/**
 * CreateJobDescriptionRequest - TypeScript type inferred from CreateJobDescriptionRequestSchema
 */
export type CreateJobDescriptionRequest = z.infer<typeof CreateJobDescriptionRequestSchema>;

/**
 * CreatePresignedUrlRequestSchema - Zod schema for pre-signed URL request
 * Accepts filename to construct S3 key: uploads/{jdId}/{filename}
 */
export const CreatePresignedUrlRequestSchema = z.object({
  filename: z.string().min(1, 'filename is required and must be non-empty'),
});

/**
 * CreatePresignedUrlRequest - TypeScript type inferred from CreatePresignedUrlRequestSchema
 */
export type CreatePresignedUrlRequest = z.infer<typeof CreatePresignedUrlRequestSchema>;

/**
 * CreatePresignedUrlResponseSchema - Zod schema for pre-signed URL response
 * Returns jdId, s3Key, and presignedUrl for direct S3 upload
 */
export const CreatePresignedUrlResponseSchema = z.object({
  jdId: z.uuid('jdId must be a valid UUID'),
  s3Key: z.string().min(1, 's3Key is required'),
  presignedUrl: z.string().url('presignedUrl must be a valid URL'),
});

/**
 * CreatePresignedUrlResponse - TypeScript type inferred from CreatePresignedUrlResponseSchema
 */
export type CreatePresignedUrlResponse = z.infer<typeof CreatePresignedUrlResponseSchema>;

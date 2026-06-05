import { z } from 'zod';

/**
 * JobDescriptionSchema - Zod schema for Job Description entity
 * Validates all JD attributes: title, rawText, optional s3Key, timestamps, and TTL
 */
export const JobDescriptionSchema = z.object({
  jdId: z.uuid('Job description identifier must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  rawText: z
    .string()
    .min(100, 'Job description text must be at least 100 characters')
    .max(5000, 'Job description text must be 5000 characters or less'),
  s3Key: z.string().optional(),
  createdAt: z.iso.datetime('Created at must be a valid ISO 8601 datetime'),
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
    title: z.string().min(1, 'Title is required'),
    rawText: z
      .string()
      .min(100, 'Job description text must be at least 100 characters')
      .max(5000, 'Job description text must be 5000 characters or less'),
  }),
  z.object({
    mode: z.literal('upload'),
    title: z.string().min(1, 'Title is required'),
    s3Key: z.string().min(1, 'S3 key is required'),
    jdId: z.uuid('Job description identifier must be a valid UUID').optional(),
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
  filename: z.string().min(1, 'Filename is required'),
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
  jdId: z.uuid('Job description identifier must be a valid UUID'),
  s3Key: z.string().min(1, 'S3 key is required'),
  presignedUrl: z.url('Presigned URL must be a valid URL'),
});

/**
 * CreatePresignedUrlResponse - TypeScript type inferred from CreatePresignedUrlResponseSchema
 */
export type CreatePresignedUrlResponse = z.infer<typeof CreatePresignedUrlResponseSchema>;

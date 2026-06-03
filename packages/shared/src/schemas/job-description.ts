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
  }),
]);

/**
 * CreateJobDescriptionRequest - TypeScript type inferred from CreateJobDescriptionRequestSchema
 */
export type CreateJobDescriptionRequest = z.infer<typeof CreateJobDescriptionRequestSchema>;

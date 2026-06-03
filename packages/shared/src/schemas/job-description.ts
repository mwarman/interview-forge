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

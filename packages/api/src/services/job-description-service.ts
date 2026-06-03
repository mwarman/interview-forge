import { randomUUID } from 'crypto';

import { JobDescription } from '@interview-forge/shared';

import { logger } from '@/utils/logger';
import { pdfService } from '@/services/pdf-service';
import { jobDescriptionRepository, JobDescriptionItem } from '@/repositories/job-description-repository';

/**
 * Service for Job Description business logic
 * Encapsulates the orchestration of creating and persisting job descriptions
 */
export class JobDescriptionService {
  /**
   * Calculate TTL for 72 hours from now (in seconds)
   */
  private calculateTTL(): number {
    return Math.floor(Date.now() / 1000) + 72 * 3600;
  }

  /**
   * Create a job description from pasted text
   * @param title - The job title
   * @param rawText - The raw job description text
   * @returns The created job description result with jdId, createdAt, and ttl
   */
  async createFromPaste(title: string, rawText: string): Promise<JobDescription> {
    logger.info({ title }, '[JobDescriptionService.createFromPaste] > createFromPaste');

    try {
      const jdId = randomUUID();
      const now = new Date().toISOString();
      const ttl = this.calculateTTL();

      const item: JobDescriptionItem = {
        PK: `JD#${jdId}`,
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: now,
        jdId,
        title,
        rawText,
        createdAt: now,
        TTL: ttl,
      };

      logger.debug({ jdId }, '[JobDescriptionService.createFromPaste] - Persisting job description');
      await jobDescriptionRepository.put(item);
      logger.debug({ jdId, title }, '[JobDescriptionService.createFromPaste] - Job description created from paste');

      logger.info('[JobDescriptionService.createFromPaste] < createFromPaste');
      return jobDescriptionRepository.toJobDescription(item);
    } catch (error) {
      logger.error({ error, title }, '[JobDescriptionService.createFromPaste] - Failed to create from paste');
      throw error;
    }
  }

  /**
   * Create a job description from a file uploaded to S3
   * @param title - The job title
   * @param s3Key - The S3 key of the uploaded file
   * @param jdId - Optional pre-generated jdId (from pre-signed URL creation); if not provided, generates a new UUID
   * @returns The created job description result with jdId, createdAt, and ttl
   */
  async createFromUpload(title: string, s3Key: string, jdId?: string): Promise<JobDescription> {
    logger.info({ title, s3Key, jdId }, '[JobDescriptionService.createFromUpload] > createFromUpload');

    try {
      logger.debug({ s3Key }, '[JobDescriptionService.createFromUpload] - Extracting text from file');
      const rawText = await pdfService.extractTextFromFile(s3Key);

      logger.debug({ s3Key, textLength: rawText.length }, '[JobDescriptionService.createFromUpload] - Text extracted');

      // Use provided jdId or generate a new one
      const resolvedJdId = jdId || randomUUID();
      if (!jdId) {
        logger.debug({ resolvedJdId }, '[JobDescriptionService.createFromUpload] - Generated new jdId');
      } else {
        logger.debug({ resolvedJdId }, '[JobDescriptionService.createFromUpload] - Using provided jdId');
      }

      const now = new Date().toISOString();
      const ttl = this.calculateTTL();

      const item: JobDescriptionItem = {
        PK: `JD#${resolvedJdId}`,
        SK: 'METADATA',
        GSI1PK: 'JDS',
        GSI1SK: now,
        jdId: resolvedJdId,
        title,
        rawText,
        s3Key,
        createdAt: now,
        TTL: ttl,
      };

      logger.debug({ jdId: resolvedJdId }, '[JobDescriptionService.createFromUpload] - Persisting job description');
      await jobDescriptionRepository.put(item);
      logger.debug(
        { jdId: resolvedJdId, title, s3Key },
        '[JobDescriptionService.createFromUpload] - Job description created from upload',
      );

      logger.info('[JobDescriptionService.createFromUpload] < createFromUpload');
      return jobDescriptionRepository.toJobDescription(item);
    } catch (error) {
      logger.error(
        { error, title, s3Key, jdId },
        '[JobDescriptionService.createFromUpload] - Failed to create from upload',
      );
      throw error;
    }
  }

  /**
   * List all Job Descriptions sorted by createdAt descending
   * @returns Array of all job descriptions sorted by createdAt descending
   * @throws Error if repository query fails
   */
  async listAll(): Promise<JobDescription[]> {
    logger.info('[JobDescriptionService.listAll] > listAll');

    try {
      const jobDescriptions = await jobDescriptionRepository.queryAll();
      logger.info(
        { count: jobDescriptions.length },
        '[JobDescriptionService.listAll] - Retrieved all job descriptions',
      );
      logger.info('[JobDescriptionService.listAll] < listAll');
      return jobDescriptions;
    } catch (error) {
      logger.error({ error }, '[JobDescriptionService.listAll] - Failed to list all job descriptions');
      throw error;
    }
  }

  /**
   * Get a single Job Description by its ID
   * @param jdId - The unique identifier of the job description
   * @returns The JobDescription if found, or null if not found
   * @throws Error if repository get fails
   */
  async getById(jdId: string): Promise<JobDescription | null> {
    logger.info({ jdId }, '[JobDescriptionService.getById] > getById');

    try {
      const jobDescription = await jobDescriptionRepository.getById(jdId);

      if (!jobDescription) {
        logger.info({ jdId }, '[JobDescriptionService.getById] - Job description not found');
        return null;
      }

      logger.info({ jdId }, '[JobDescriptionService.getById] < getById');
      return jobDescription;
    } catch (error) {
      logger.error({ error, jdId }, '[JobDescriptionService.getById] - Failed to get job description');
      throw error;
    }
  }
}

/**
 * Singleton instance of JobDescriptionService
 */
export const jobDescriptionService = new JobDescriptionService();

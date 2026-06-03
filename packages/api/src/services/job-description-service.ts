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
    logger.debug({ title }, '[JobDescriptionService.createFromPaste] > createFromPaste');

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

      logger.info({ jdId, title }, '[JobDescriptionService.createFromPaste] - Job description created from paste');
      logger.debug('[JobDescriptionService.createFromPaste] < createFromPaste');

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
   * @returns The created job description result with jdId, createdAt, and ttl
   */
  async createFromUpload(title: string, s3Key: string): Promise<JobDescription> {
    logger.debug({ title, s3Key }, '[JobDescriptionService.createFromUpload] > createFromUpload');

    try {
      logger.debug({ s3Key }, '[JobDescriptionService.createFromUpload] - Extracting text from file');
      const rawText = await pdfService.extractTextFromFile(s3Key);

      logger.debug({ s3Key, textLength: rawText.length }, '[JobDescriptionService.createFromUpload] - Text extracted');

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
        s3Key,
        createdAt: now,
        TTL: ttl,
      };

      logger.debug({ jdId }, '[JobDescriptionService.createFromUpload] - Persisting job description');
      await jobDescriptionRepository.put(item);

      logger.info(
        { jdId, title, s3Key },
        '[JobDescriptionService.createFromUpload] - Job description created from upload',
      );
      logger.debug('[JobDescriptionService.createFromUpload] < createFromUpload');

      return jobDescriptionRepository.toJobDescription(item);
    } catch (error) {
      logger.error({ error, title, s3Key }, '[JobDescriptionService.createFromUpload] - Failed to create from upload');
      throw error;
    }
  }
}

/**
 * Singleton instance of JobDescriptionService
 */
export const jobDescriptionService = new JobDescriptionService();

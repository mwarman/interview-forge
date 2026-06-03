import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { JobDescription } from '@interview-forge/shared';

import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import { dynamoClient } from '@/utils/dynamo-client';

/**
 * Job Description item structure for DynamoDB
 */
export interface JobDescriptionItem extends JobDescription {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Repository for Job Description persistence operations
 * Encapsulates all DynamoDB interactions for JD entities
 */
export class JobDescriptionRepository {
  /**
   * Convert a DynamoDB item to a JobDescription entity
   * @param item - The DynamoDB item
   * @returns The JobDescription entity
   */
  toJobDescription(item: JobDescriptionItem): JobDescription {
    const { PK: _pk, SK: _sk, GSI1PK: _gsi1pk, GSI1SK: _gsi1sk, ...jobDescription } = item;
    return jobDescription;
  }

  /**
   * Write a Job Description item to DynamoDB
   * @param item - The job description item to persist
   * @throws Error if DynamoDB write fails
   */
  async put(item: JobDescriptionItem): Promise<void> {
    logger.debug({ jdId: item.jdId }, '[JobDescriptionRepository.put] > put');

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: config.JD_TABLE_NAME,
          Item: item,
        }),
      );

      logger.debug({ jdId: item.jdId }, '[JobDescriptionRepository.put] - Item written to DynamoDB');
    } catch (error) {
      logger.error({ error, jdId: item.jdId }, '[JobDescriptionRepository.put] - DynamoDB write failed');
      throw error;
    }
  }
}

/**
 * Singleton instance of JobDescriptionRepository
 */
export const jobDescriptionRepository = new JobDescriptionRepository();

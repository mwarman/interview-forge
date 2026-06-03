import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

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

  /**
   * Query all Job Description items from GSI1, sorted by createdAt descending
   * @returns Array of JobDescription items sorted by createdAt descending
   * @throws Error if DynamoDB query fails
   */
  async queryAll(): Promise<JobDescription[]> {
    logger.debug('[JobDescriptionRepository.queryAll] > queryAll');

    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: config.JD_TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': 'JDS',
          },
          ScanIndexForward: false, // Sort by GSI1SK (createdAt) descending
        }),
      );

      logger.debug(
        { itemCount: result.Items?.length || 0 },
        '[JobDescriptionRepository.queryAll] - Items retrieved from DynamoDB',
      );

      if (!result.Items || result.Items.length === 0) {
        logger.debug('[JobDescriptionRepository.queryAll] - No items found');
        return [];
      }

      const jobDescriptions = result.Items.map((item) => this.toJobDescription(item as JobDescriptionItem));

      logger.debug('[JobDescriptionRepository.queryAll] < queryAll');
      return jobDescriptions;
    } catch (error) {
      logger.error({ error }, '[JobDescriptionRepository.queryAll] - DynamoDB query failed');
      throw error;
    }
  }

  /**
   * Fetch a single Job Description by its ID
   * @param jdId - The unique identifier of the job description
   * @returns The JobDescription if found, null if not found
   * @throws Error if DynamoDB get fails
   */
  async getById(jdId: string): Promise<JobDescription | null> {
    logger.debug({ jdId }, '[JobDescriptionRepository.getById] > getById');

    try {
      const result = await dynamoClient.send(
        new GetCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: 'METADATA',
          },
        }),
      );

      if (!result.Item) {
        logger.debug({ jdId }, '[JobDescriptionRepository.getById] - Item not found');
        return null;
      }

      logger.debug({ jdId }, '[JobDescriptionRepository.getById] - Item retrieved from DynamoDB');

      const jobDescription = this.toJobDescription(result.Item as JobDescriptionItem);

      logger.debug({ jdId }, '[JobDescriptionRepository.getById] < getById');
      return jobDescription;
    } catch (error) {
      logger.error({ error, jdId }, '[JobDescriptionRepository.getById] - DynamoDB get failed');
      throw error;
    }
  }
}

/**
 * Singleton instance of JobDescriptionRepository
 */
export const jobDescriptionRepository = new JobDescriptionRepository();

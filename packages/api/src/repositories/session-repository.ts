import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

import { Session } from '@interview-forge/shared';

import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import { dynamoClient } from '@/utils/dynamo-client';

/**
 * Session item structure for DynamoDB
 */
export interface SessionItem extends Session {
  PK: string;
  SK: string;
}

/**
 * Repository for Session persistence operations
 * Encapsulates all DynamoDB interactions for Session entities
 * Uses single table design with PK: JD#{jdId}, SK: SESSION#{sessionId}
 */
export class SessionRepository {
  /**
   * Convert a DynamoDB item to a Session entity
   * @param item - The DynamoDB item
   * @returns The Session entity
   */
  toSession(item: SessionItem): Session {
    const { PK: _pk, SK: _sk, ...session } = item;
    return session;
  }

  /**
   * Write a Session item to DynamoDB
   * @param item - The session item to persist
   * @throws Error if DynamoDB write fails
   */
  async put(item: SessionItem): Promise<void> {
    logger.debug({ sessionId: item.sessionId }, '[SessionRepository.put] > put');

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: config.JD_TABLE_NAME,
          Item: item,
        }),
      );

      logger.debug({ sessionId: item.sessionId }, '[SessionRepository.put] - Item written to DynamoDB');
    } catch (error) {
      logger.error({ error, sessionId: item.sessionId }, '[SessionRepository.put] - DynamoDB write failed');
      throw error;
    }
  }

  /**
   * Fetch a single Session by its ID and parent JD ID
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @returns The Session if found, null if not found
   * @throws Error if DynamoDB get fails
   */
  async getById(jdId: string, sessionId: string): Promise<Session | null> {
    logger.debug({ jdId, sessionId }, '[SessionRepository.getById] > getById');

    try {
      const result = await dynamoClient.send(
        new GetCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: `SESSION#${sessionId}`,
          },
        }),
      );

      if (!result.Item) {
        logger.debug({ jdId, sessionId }, '[SessionRepository.getById] - Item not found');
        return null;
      }

      logger.debug({ jdId, sessionId }, '[SessionRepository.getById] - Item retrieved from DynamoDB');

      const session = this.toSession(result.Item as SessionItem);

      logger.debug({ jdId, sessionId }, '[SessionRepository.getById] < getById');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionRepository.getById] - DynamoDB get failed');
      throw error;
    }
  }
}

/**
 * Singleton instance of SessionRepository
 */
export const sessionRepository = new SessionRepository();

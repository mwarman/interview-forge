import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Repository for Session persistence operations
 * Encapsulates all DynamoDB interactions for Session entities
 * Uses single table design with:
 * - PK: JD#{jdId}, SK: SESSION#{sessionId} (for direct session lookup)
 * - GSI1PK: JD#{jdId}, GSI1SK: createdAt (for querying all sessions for a JD sorted by creation time)
 */
export class SessionRepository {
  /**
   * Convert a DynamoDB item to a Session entity
   * @param item - The DynamoDB item
   * @returns The Session entity
   */
  toSession(item: SessionItem): Session {
    const { PK: _pk, SK: _sk, GSI1PK: _gsi1pk, GSI1SK: _gsi1sk, ...session } = item;
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

  /**
   * Query all sessions for a given JD ID, sorted by createdAt ascending
   * Uses GSI1 index: GSI1PK = JD#{jdId}, GSI1SK = SESSION#{createdAt}#{sessionId}
   * Filters to only SESSION records (excludes JD METADATA if any were in the same partition)
   * @param jdId - The unique identifier of the parent job description
   * @returns Array of Session items sorted by createdAt ascending
   * @throws Error if DynamoDB query fails
   */
  async queryByJdId(jdId: string): Promise<Session[]> {
    logger.debug({ jdId }, '[SessionRepository.queryByJdId] > queryByJdId');

    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: config.JD_TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk_prefix)',
          ExpressionAttributeValues: {
            ':gsi1pk': `JD#${jdId}`,
            ':gsi1sk_prefix': 'SESSION#',
          },
          ScanIndexForward: true, // Sort by GSI1SK ascending (chronologically by createdAt)
        }),
      );

      logger.debug(
        { jdId, itemCount: result.Items?.length || 0 },
        '[SessionRepository.queryByJdId] - Items retrieved from DynamoDB',
      );

      if (!result.Items || result.Items.length === 0) {
        logger.debug({ jdId }, '[SessionRepository.queryByJdId] - No items found');
        return [];
      }

      const sessions = result.Items.map((item) => this.toSession(item as SessionItem));

      logger.debug({ jdId }, '[SessionRepository.queryByJdId] < queryByJdId');
      return sessions;
    } catch (error) {
      logger.error({ error, jdId }, '[SessionRepository.queryByJdId] - DynamoDB query failed');
      throw error;
    }
  }

  /**
   * Update a Session with arbitrary updates
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param updates - Object with field names and values to update
   * @returns The updated Session entity
   * @throws Error if DynamoDB update fails or item not found
   */
  async updateById(jdId: string, sessionId: string, updates: Record<string, unknown>): Promise<Session> {
    logger.debug({ jdId, sessionId, updates }, '[SessionRepository.updateById] > updateById');

    try {
      // Build update expression and attribute values dynamically
      const updateExpressionParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};
      let valueIndex = 0;

      for (const [key, value] of Object.entries(updates)) {
        const placeholder = `:val${valueIndex}`;
        updateExpressionParts.push(`#${key} = ${placeholder}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[placeholder] = value;
        valueIndex++;
      }

      const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: `SESSION#${sessionId}`,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        }),
      );

      if (!result.Attributes) {
        logger.error({ jdId, sessionId }, '[SessionRepository.updateById] - Updated item not returned');
        throw new Error('Updated item not returned from DynamoDB');
      }

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateById] - Item updated in DynamoDB');

      const session = this.toSession(result.Attributes as SessionItem);

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateById] < updateById');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionRepository.updateById] - DynamoDB update failed');
      throw error;
    }
  }

  /**
   * Update a Session's plan with approval status using conditional expression
   * Atomically updates plan and status to PLAN_APPROVED
   * Uses a condition expression to ensure status is PLAN_GENERATED (idempotency guard)
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param plan - Optional modified plan to overwrite existing plan
   * @returns The updated Session entity
   * @throws ConditionalCheckFailedException if status is not PLAN_GENERATED
   * @throws Error if DynamoDB update fails or item not found
   */
  async updateWithApprovedPlan(jdId: string, sessionId: string, plan?: Record<string, unknown>): Promise<Session> {
    logger.debug(
      { jdId, sessionId, hasPlan: !!plan },
      '[SessionRepository.updateWithApprovedPlan] > updateWithApprovedPlan',
    );

    try {
      // Build update expression for status and optionally plan
      const updateExpressionParts: string[] = [];
      const expressionAttributeValues: Record<string, unknown> = {
        ':generated': 'PLAN_GENERATED',
        ':approved': 'PLAN_APPROVED',
      };

      updateExpressionParts.push('#status = :approved');

      if (plan) {
        updateExpressionParts.push('#plan = :plan');
        expressionAttributeValues[':plan'] = plan;
      }

      const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: `SESSION#${sessionId}`,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: {
            '#status': 'status',
            '#plan': 'plan',
          },
          ExpressionAttributeValues: expressionAttributeValues,
          ConditionExpression: '#status = :generated',
          ReturnValues: 'ALL_NEW',
        }),
      );

      if (!result.Attributes) {
        logger.error({ jdId, sessionId }, '[SessionRepository.updateWithApprovedPlan] - Updated item not returned');
        throw new Error('Updated item not returned from DynamoDB');
      }

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithApprovedPlan] - Item updated in DynamoDB');

      const session = this.toSession(result.Attributes as SessionItem);

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithApprovedPlan] < updateWithApprovedPlan');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionRepository.updateWithApprovedPlan] - DynamoDB update failed');
      throw error;
    }
  }

  /**
   * Update a Session with a scorecard using conditional expression
   * Atomically updates scorecard and status to SCORED
   * Uses a condition expression to prevent overwriting scorecards in terminal states
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param scorecard - The scorecard object to save to the session
   * @returns The updated Session entity
   * @throws ConditionalCheckFailedException if status is ASSESSED or COMPLETE
   * @throws Error if DynamoDB update fails or item not found
   */
  async updateWithScorecard(jdId: string, sessionId: string, scorecard: Record<string, unknown>): Promise<Session> {
    logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithScorecard] > updateWithScorecard');

    try {
      const updateExpression = 'SET #scorecard = :scorecard, #status = :scored';

      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: `SESSION#${sessionId}`,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: {
            '#scorecard': 'scorecard',
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':scorecard': scorecard,
            ':scored': 'SCORED',
            ':assessed': 'ASSESSED',
            ':complete': 'COMPLETE',
          },
          ConditionExpression: 'NOT #status IN (:assessed, :complete)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      if (!result.Attributes) {
        logger.error({ jdId, sessionId }, '[SessionRepository.updateWithScorecard] - Updated item not returned');
        throw new Error('Updated item not returned from DynamoDB');
      }

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithScorecard] - Item updated in DynamoDB');

      const session = this.toSession(result.Attributes as SessionItem);

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithScorecard] < updateWithScorecard');
      return session;
    } catch (error) {
      logger.error({ error, jdId, sessionId }, '[SessionRepository.updateWithScorecard] - DynamoDB update failed');
      throw error;
    }
  }

  /**
   * Update a Session with approved assessment using conditional expression
   * Fetches current session, merges override values into existing assessment, then updates status to COMPLETE
   * Uses a condition expression to ensure status is ASSESSED (idempotency guard)
   * @param jdId - The unique identifier of the parent job description
   * @param sessionId - The unique identifier of the session
   * @param overrides - Optional object with fields to merge into existing assessment { recommendation?, overrideReason? }
   * @returns The updated Session entity
   * @throws ConditionalCheckFailedException if status is not ASSESSED
   * @throws Error if DynamoDB operations fail or item not found
   */
  async updateWithApprovedAssessment(
    jdId: string,
    sessionId: string,
    overrides?: { recommendation?: string; overrideReason?: string },
  ): Promise<Session> {
    logger.debug(
      { jdId, sessionId, hasOverrides: !!overrides },
      '[SessionRepository.updateWithApprovedAssessment] > updateWithApprovedAssessment',
    );

    try {
      // Fetch current session to get existing assessment
      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithApprovedAssessment] - Fetching current session');

      const session = await this.getById(jdId, sessionId);

      if (!session) {
        logger.error({ jdId, sessionId }, '[SessionRepository.updateWithApprovedAssessment] - Session not found');
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (!session.assessment) {
        logger.error(
          { jdId, sessionId },
          '[SessionRepository.updateWithApprovedAssessment] - Assessment not found in session',
        );
        throw new Error(`Assessment not found in session: ${sessionId}`);
      }

      // Merge overrides into existing assessment
      const mergedAssessment = { ...session.assessment };

      if (overrides?.recommendation) {
        logger.debug(
          { jdId, sessionId },
          '[SessionRepository.updateWithApprovedAssessment] - Merging recommendation override',
        );
        mergedAssessment.recommendation = overrides.recommendation;
      }

      if (overrides?.overrideReason) {
        logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithApprovedAssessment] - Merging override reason');
        mergedAssessment.overrideReason = overrides.overrideReason;
      }

      logger.debug(
        { jdId, sessionId },
        '[SessionRepository.updateWithApprovedAssessment] - Updating session with merged assessment and COMPLETE status',
      );

      // Update session with merged assessment and status COMPLETE
      const updateExpression = 'SET #assessment = :assessment, #status = :complete';

      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: config.JD_TABLE_NAME,
          Key: {
            PK: `JD#${jdId}`,
            SK: `SESSION#${sessionId}`,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: {
            '#assessment': 'assessment',
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':assessment': mergedAssessment,
            ':complete': 'COMPLETE',
            ':assessed': 'ASSESSED',
          },
          ConditionExpression: '#status = :assessed',
          ReturnValues: 'ALL_NEW',
        }),
      );

      if (!result.Attributes) {
        logger.error(
          { jdId, sessionId },
          '[SessionRepository.updateWithApprovedAssessment] - Updated item not returned',
        );
        throw new Error('Updated item not returned from DynamoDB');
      }

      logger.debug({ jdId, sessionId }, '[SessionRepository.updateWithApprovedAssessment] - Item updated in DynamoDB');

      const updatedSession = this.toSession(result.Attributes as SessionItem);

      logger.debug(
        { jdId, sessionId },
        '[SessionRepository.updateWithApprovedAssessment] < updateWithApprovedAssessment',
      );
      return updatedSession;
    } catch (error) {
      logger.error(
        { error, jdId, sessionId },
        '[SessionRepository.updateWithApprovedAssessment] - DynamoDB update failed',
      );
      throw error;
    }
  }
}

/**
 * Singleton instance of SessionRepository
 */
export const sessionRepository = new SessionRepository();

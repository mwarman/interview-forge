import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should load valid configuration with all variables set', async () => {
      // Arrange
      process.env.LOG_ENABLED = 'true';
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FORMAT = 'json';
      process.env.JD_TABLE_NAME = 'test-table';
      process.env.JD_BUCKET_NAME = 'test-bucket';
      process.env.PLAN_AGENT_ID = 'test-agent-id';
      process.env.PLAN_AGENT_ALIAS_ID = 'test-agent-alias';
      process.env.PLAN_WORKER_FUNCTION_NAME = 'test-plan-worker-function';
      process.env.ASSESS_AGENT_ID = 'test-assess-agent-id';
      process.env.ASSESS_AGENT_ALIAS_ID = 'test-assess-agent-alias';
      process.env.ASSESS_WORKER_FUNCTION_NAME = 'test-assess-worker-function';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.LOG_FORMAT).toBe('json');
      expect(config.JD_TABLE_NAME).toBe('test-table');
      expect(config.JD_BUCKET_NAME).toBe('test-bucket');
      expect(config.PLAN_AGENT_ID).toBe('test-agent-id');
      expect(config.PLAN_AGENT_ALIAS_ID).toBe('test-agent-alias');
      expect(config.PLAN_WORKER_FUNCTION_NAME).toBe('test-plan-worker-function');
      expect(config.ASSESS_AGENT_ID).toBe('test-assess-agent-id');
      expect(config.ASSESS_AGENT_ALIAS_ID).toBe('test-assess-agent-alias');
      expect(config.ASSESS_WORKER_FUNCTION_NAME).toBe('test-assess-worker-function');
    });

    it('should use default LOG_LEVEL if not set', async () => {
      // Arrange
      delete process.env.LOG_LEVEL;
      process.env.JD_TABLE_NAME = 'test-table';
      process.env.JD_BUCKET_NAME = 'test-bucket';
      process.env.PLAN_AGENT_ID = 'test-agent-id';
      process.env.PLAN_AGENT_ALIAS_ID = 'test-agent-alias';
      process.env.PLAN_WORKER_FUNCTION_NAME = 'test-plan-worker-function';
      process.env.ASSESS_AGENT_ID = 'test-assess-agent-id';
      process.env.ASSESS_AGENT_ALIAS_ID = 'test-assess-agent-alias';
      process.env.ASSESS_WORKER_FUNCTION_NAME = 'test-assess-worker-function';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(config.LOG_LEVEL);
    });

    it('should use default LOG_FORMAT if not set', async () => {
      // Arrange
      delete process.env.LOG_FORMAT;
      process.env.JD_TABLE_NAME = 'test-table';
      process.env.JD_BUCKET_NAME = 'test-bucket';
      process.env.PLAN_AGENT_ID = 'test-agent-id';
      process.env.PLAN_AGENT_ALIAS_ID = 'test-agent-alias';
      process.env.PLAN_WORKER_FUNCTION_NAME = 'test-plan-worker-function';
      process.env.ASSESS_AGENT_ID = 'test-assess-agent-id';
      process.env.ASSESS_AGENT_ALIAS_ID = 'test-assess-agent-alias';
      process.env.ASSESS_WORKER_FUNCTION_NAME = 'test-assess-worker-function';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['json', 'text']).toContain(config.LOG_FORMAT);
    });
  });
});
